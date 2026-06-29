import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../api';

// Company payments tab: outstanding summary, status filter, pay + PDF download per row.
export default function Payments() {
  const [payments, setPayments] = useState(null);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [err, setErr] = useState(null);

  function load() {
    const q = status ? `?status=${status}` : '';
    api.get(`/api/company/payments${q}`).then(setPayments).catch(() => setPayments([]));
    api.get('/api/company/payments/summary').then(setSummary).catch(() => {});
  }
  useEffect(load, [status]);

  async function download(id) {
    if (downloadingId) return;
    setErr(null); setDownloadingId(id);
    try {
      const blob = await api.get(`/api/company/payments/${id}/receipt`);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Failed to download');
    } finally { setDownloadingId(null); }
  }

  return (
    <div className="page">
      <h1>Payments</h1>
      {summary && (
        <div className="stat-grid mt-16">
          <div className="card stat"><div className="label">Pending</div><div className="value">{summary.pendingCount}</div></div>
          <div className="card stat"><div className="label">Outstanding (LKR)</div><div className="value">{Number(summary.totalOutstanding).toLocaleString()}</div></div>
          <div className="card stat"><div className="label">Total paid (LKR)</div><div className="value">{Number(summary.totalPaid).toLocaleString()}</div></div>
        </div>
      )}
      {err && <div className="form-error mt-16">{err}</div>}

      <div className="chips mt-16">
        {['', 'PENDING', 'PAID'].map((s) => (
          <span key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s || 'All'}</span>
        ))}
      </div>

      <div className="card mt-16">
        {!payments ? <div className="skeleton skel-card" /> : payments.length === 0 ? (
          <div className="empty">No payments.</div>
        ) : (
          <table>
            <thead><tr><th>Receipt</th><th>Job</th><th>Commission</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.receiptNumber}</td>
                  <td>{p.jobTitle}</td>
                  <td>LKR {Number(p.commissionAmount).toLocaleString()}</td>
                  <td><span className={`badge ${p.status}`}>{p.status}</span></td>
                  <td>
                    <div className="row">
                      {p.status === 'PENDING' && <Link className="btn btn-primary btn-sm" to={`/company/payments/${p.id}/pay`}>Pay</Link>}
                      <button className="btn btn-secondary btn-sm" disabled={downloadingId === p.id} onClick={() => download(p.id)}>
                        {downloadingId === p.id ? 'Downloading…' : p.status === 'PAID' ? 'Receipt' : 'Invoice'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
