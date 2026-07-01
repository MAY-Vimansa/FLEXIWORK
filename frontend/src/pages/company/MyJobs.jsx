import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import ConfirmDialog from '../../components/ConfirmDialog';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function ExtendModal({ jobId, onClose, onDone }) {
  const [newEndTime, setNewEndTime] = useState('20:00');
  const [extraWage, setExtraWage] = useState('500');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!TIME_RE.test(newEndTime)) { setErr('Enter a valid time as HH:MM (e.g. 20:00).'); return; }
    const wage = Number(extraWage);
    if (Number.isNaN(wage) || wage < 0) { setErr('Extra wage must be a positive number.'); return; }
    setErr(null); setBusy(true);
    try {
      await api.put(`/api/jobs/${jobId}/extend`, { newEndTime: newEndTime + ':00', extraWage: wage });
      onDone();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <form className="card" style={{ width: '100%', maxWidth: 380 }} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3 style={{ marginTop: 0 }}>Extend shift</h3>
        {err && <div className="form-error mt-8">{err}</div>}
        <div className="field mt-8"><label>New end time (24h)</label>
          <input className="input" type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} required />
          <p className="muted">For overnight shifts, a time earlier than the start time means next day.</p></div>
        <div className="field"><label>Extra wage per on-site worker (LKR)</label>
          <input className="input" type="number" min="0" step="0.01" value={extraWage} onChange={(e) => setExtraWage(e.target.value)} required /></div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Extending…' : 'Extend shift'}</button>
        </div>
      </form>
    </div>
  );
}

// Company/poster job list with manage links; owner can complete/bill and cancel.
export default function MyJobs() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [confirmCompleteId, setConfirmCompleteId] = useState(null);
  const [extendingId, setExtendingId] = useState(null);
  const isOwner = user?.role === 'COMPANY';

  function load() { api.get('/api/jobs/mine?size=100').then(setData).catch(() => setData({ content: [] })); }
  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, []);

  async function cancel() {
    const id = confirmCancelId; setConfirmCancelId(null);
    await api.del(`/api/jobs/${id}`); load();
  }
  async function complete() {
    const id = confirmCompleteId; setConfirmCompleteId(null);
    await api.post(`/api/company/jobs/${id}/complete`); load();
  }

  if (!data) return <div className="page"><div className="skeleton skel-card" /></div>;

  return (
    <div className="page mj">
      <div className="mj-header">
        <div className="mj-title-wrap">
          <h1 className="mj-title">My jobs</h1>
          <span className="live-pill"><span className="live-dot" /> Live</span>
        </div>
        <Link className="mj-post-btn" to="/company/post">Post job</Link>
      </div>

      {data.content.length === 0 && <div className="empty">No jobs yet.</div>}

      {data.content.map((j) => {
        const accepted = Number(j.workersAccepted) || 0;
        const needed = Number(j.workersNeeded) || 0;
        const pct = needed > 0 ? Math.min(100, Math.round((accepted / needed) * 100)) : 0;
        const active = j.status === 'OPEN' || j.status === 'FILLED';
        return (
          <div key={j.id} className="mj-card">
            <div className="mj-card-top">
              <h3 className="mj-job-title">{j.title}</h3>
              <span className={`badge ${j.status}`}>{j.status}</span>
            </div>
            <div className="mj-card-sub">{j.jobDate} · {j.district}</div>

            <div className="mj-card-stats">
              <div className="mj-pay">
                <div className="mj-stat-label">Pay · LKR</div>
                <div className="mj-pay-value">{Math.round(Number(j.dailyWage)).toLocaleString()}</div>
              </div>
              <div className="mj-accepted">
                <div className="mj-accepted-head">
                  <span className="mj-stat-label">Accepted</span>
                  <span className="mj-accepted-count">{accepted} / {needed}</span>
                </div>
                <div className="mj-bar"><div className="mj-bar-fill" style={{ width: `${pct}%` }} /></div>
              </div>
            </div>

            <div className="mj-divider" />

            <div className="mj-actions">
              <Link className="mj-btn mj-btn-ghost" to={`/company/jobs/${j.id}/applicants`}>Applicants</Link>
              <Link className="mj-btn mj-btn-link" to={`/jobs/${j.id}`} state={{ from: '/company/jobs' }}>View details</Link>
              {active &&
                <button className="mj-btn mj-btn-ghost" onClick={() => setExtendingId(j.id)}>Extend shift</button>}
              {isOwner && active &&
                <button className="mj-btn mj-btn-ghost" onClick={() => setConfirmCompleteId(j.id)}>Complete & bill</button>}
              {active &&
                <button className="mj-btn mj-btn-danger" onClick={() => setConfirmCancelId(j.id)}>Cancel</button>}
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        open={!!confirmCancelId}
        title="Cancel this job?"
        message="Accepted workers will be notified that the job was cancelled."
        confirmLabel="Cancel job"
        onConfirm={cancel}
        onCancel={() => setConfirmCancelId(null)}
      />
      <ConfirmDialog
        open={!!confirmCompleteId}
        title="Complete & bill this job?"
        message="This marks the job completed and bills commission on attended workers."
        confirmLabel="Complete & bill"
        danger={false}
        onConfirm={complete}
        onCancel={() => setConfirmCompleteId(null)}
      />
      {extendingId && (
        <ExtendModal
          jobId={extendingId}
          onClose={() => setExtendingId(null)}
          onDone={() => { setExtendingId(null); load(); }}
        />
      )}
    </div>
  );
}
