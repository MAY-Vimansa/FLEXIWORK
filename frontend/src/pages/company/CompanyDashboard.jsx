import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';

const POLL_MS = 20_000;

const JOB_STATS = [
  { key: 'totalJobs', label: 'Total jobs', tone: 'tone-ink' },
  { key: 'openJobs', label: 'Open', tone: 'tone-green' },
  { key: 'filledJobs', label: 'Filled', tone: 'tone-blue' },
  { key: 'completedJobs', label: 'Completed', tone: 'tone-purple' },
  { key: 'cancelledJobs', label: 'Cancelled', tone: 'tone-red' },
  { key: 'pendingApplicants', label: 'Applicants', tone: 'tone-amber' },
];

export default function CompanyDashboard() {
  const [stats, setStats] = useState(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const firstLoad = useRef(true);

  function load() {
    api.get('/api/company/dashboard')
      .then(setStats)
      .catch(() => {})
      .finally(() => { firstLoad.current = false; });
  }

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const company = stats?.company;

  return (
    <div className="page">
      <div className="row between">
        <h1>Dashboard</h1>
        <span className="live-pill"><span className="live-dot" /> Live</span>
      </div>

      {!stats && firstLoad.current ? (
        <div className="stat-grid mt-24">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton skel-card" style={{ height: 92 }} />)}
        </div>
      ) : (
        <>
          {company && (
            <section className="cd-section mt-24">
              <h4 className="cd-eyebrow">Company profile</h4>
              <div className="cd-profile">
                <div className="cd-profile-avatar">
                  {company.logoPath && !logoFailed
                    ? <img src={company.logoPath} alt={company.companyName} onError={() => setLogoFailed(true)} />
                    : <span>{(company.companyName || '?').charAt(0).toUpperCase()}</span>}
                </div>
                <div className="cd-profile-body">
                  <div className="row wrap" style={{ gap: 10 }}>
                    <h2 style={{ margin: 0 }}>{company.companyName}</h2>
                    <span className={`badge ${company.verificationStatus}`}>{company.verificationStatus}</span>
                    {company.suspended && <span className="badge CANCELLED">SUSPENDED</span>}
                  </div>
                  <div className="cd-profile-grid mt-16">
                    <div><span className="cd-profile-label">BR number</span><span>{company.brNumber}</span></div>
                    <div><span className="cd-profile-label">District</span><span>{company.district?.replaceAll('_', ' ') || '—'}</span></div>
                    <div><span className="cd-profile-label">Address</span><span>{company.addressLine || '—'}</span></div>
                    <div><span className="cd-profile-label">Verified on</span>
                      <span>{company.approvedAt ? new Date(company.approvedAt).toLocaleDateString() : 'Not yet'}</span></div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="cd-section mt-24">
            <h4 className="cd-eyebrow">Job overview</h4>
            <div className="stat-grid">
              {JOB_STATS.map((s) => (
                <div key={s.key} className={`card stat cd-stat ${s.tone}`}>
                  <div className="label">{s.label}</div>
                  <div className="value">{stats[s.key]}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="cd-section mt-24">
            <h4 className="cd-eyebrow">Finance</h4>
            <div className="stat-grid">
              <div className="card stat cd-stat tone-teal">
                <div className="label">Outstanding commission (LKR)</div>
                <div className="value">{Number(stats.outstandingCommission).toLocaleString()}</div>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="row wrap mt-24">
        <Link className="btn btn-primary" to="/company/post">Post a job</Link>
        <Link className="btn btn-secondary" to="/company/jobs">Manage jobs</Link>
        <Link className="btn btn-secondary" to="/company/payments">Payments</Link>
        <Link className="btn btn-secondary" to="/company/staff">Staff</Link>
      </div>
    </div>
  );
}
