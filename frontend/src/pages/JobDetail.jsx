import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';

// Public job detail. Workers can apply; the address links to Google Maps navigation.
export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCompany = user?.role === 'COMPANY' || user?.role === 'COMPANY_POSTER';
  const backTo = location.state?.from || (isCompany ? '/company/jobs' : '/');
  const [job, setJob] = useState(null);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => { api.get(`/api/jobs/${id}`).then(setJob).catch(() => setErr('Job not found')); }, [id]);

  async function apply() {
    if (busy || applied) return;
    setErr(null); setMsg(null);
    if (!user) { navigate('/register', { state: { from: `/jobs/${id}` } }); return; }
    setBusy(true);
    try {
      await api.post('/api/applications', { jobId: Number(id) });
      setMsg('Application submitted! Track it under My Applications.');
      setApplied(true);
      api.get(`/api/jobs/${id}`).then(setJob).catch(() => {});
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Failed to apply');
    } finally { setBusy(false); }
  }

  if (err && !job) return <div className="page"><div className="empty">{err}</div></div>;
  if (!job) return <div className="page"><div className="skeleton skel-card" /></div>;

  return (
    <div className="page page-narrow">
      <Link to={backTo} className="muted">← Back to jobs</Link>
      <div className="card mt-16">
        <div className="row between">
          <h1>{job.title}</h1>
          <span className={`badge ${job.status}`}>{job.status}</span>
        </div>
        <div className="job-meta">{job.companyName} · {job.category?.replaceAll('_', ' ')}</div>
        <p className="mt-16">{job.description}</p>

        <div className="mt-16"><strong>Wage:</strong> <span className="price">LKR {Number(job.dailyWage).toLocaleString()}</span></div>
        <div className="mt-8"><strong>Date:</strong> {job.jobDate} ({job.startTime?.slice(0,5)}–{job.endTime?.slice(0,5)})</div>
        <div className="mt-8"><strong>Slots:</strong> {job.slotsLeft} of {job.workersNeeded} left</div>
        <div className="mt-8">
          <strong>Location:</strong>{' '}
          <a href={job.mapsLink} target="_blank" rel="noreferrer">{job.addressLine}, {job.district} ↗</a>
          {job.distanceKm != null && <span className="muted"> · {job.distanceKm} km away</span>}
        </div>

        {msg && <div className="form-ok mt-16">{msg}</div>}
        {err && <div className="form-error mt-16">{err}</div>}

        {(!user || user.role === 'WORKER') && job.status === 'OPEN' && (
          <button className="btn btn-primary btn-block mt-24" disabled={busy || applied} onClick={apply}>
            {applied ? 'Applied ✓' : busy ? 'Applying…' : user ? 'Apply for this job' : 'Log in to apply'}
          </button>
        )}
      </div>
    </div>
  );
}
