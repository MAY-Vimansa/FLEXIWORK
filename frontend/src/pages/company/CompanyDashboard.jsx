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
    <div className="page cdash">
      {/* Header strip: brand + live */}
      <div className="cdash-header">
        <div className="cdash-brand">
          <div className="cdash-logo">
            {company?.logoPath && !logoFailed
              ? <img src={company.logoPath} alt={company.companyName} onError={() => setLogoFailed(true)} />
              : <span>{(company?.companyName || '?').charAt(0).toUpperCase()}</span>}
          </div>
          <div className="cdash-brand-text">
            <h2 className="cdash-company">{company?.companyName || 'Company'}</h2>
          </div>
          {company && (
            <>
              <span className={`cdash-verify badge ${company.verificationStatus}`}>{company.verificationStatus}</span>
              {company.suspended && <span className="badge CANCELLED">SUSPENDED</span>}
            </>
          )}
        </div>
        <span className="live-pill"><span className="live-dot" /> Live</span>
      </div>

      {/* Title */}
      <h1 className="cdash-title">Dashboard<span className="cdash-dot">.</span></h1>

      {!stats && firstLoad.current ? (
        <div className="stat-grid mt-24">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton skel-card" style={{ height: 92 }} />)}
        </div>
      ) : (
        <>
          {/* Company meta row */}
          {company && (
            <div className="cdash-meta">
              <div className="cdash-meta-item">
                <span className="cdash-meta-label">BR number</span>
                <span className="cdash-meta-value">{company.brNumber || '—'}</span>
              </div>
              <div className="cdash-meta-item">
                <span className="cdash-meta-label">District</span>
                <span className="cdash-meta-value">{company.district?.replaceAll('_', ' ') || '—'}</span>
              </div>
              <div className="cdash-meta-item">
                <span className="cdash-meta-label">Address</span>
                <span className="cdash-meta-value">{company.addressLine || '—'}</span>
              </div>
              <div className="cdash-meta-item">
                <span className="cdash-meta-label">Verified on</span>
                <span className={`cdash-meta-value ${company.approvedAt ? '' : 'is-muted'}`}>
                  {company.approvedAt ? new Date(company.approvedAt).toLocaleDateString() : 'Not yet'}
                </span>
              </div>
            </div>
          )}

          {/* Job overview strip */}
          <section className="cdash-section">
            <h4 className="cd-eyebrow">Job overview</h4>
            <div className="cdash-stat-strip">
              {JOB_STATS.map((s) => {
                const val = Number(stats[s.key]) || 0;
                return (
                  <div key={s.key} className="cdash-stat">
                    <div className="cdash-stat-label">{s.label}</div>
                    <div className={`cdash-stat-value ${val > 0 ? 'is-on' : 'is-zero'}`}>{stats[s.key]}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Finance */}
          <section className="cdash-section">
            <h4 className="cd-eyebrow">Finance</h4>
            <div className="cdash-finance">
              <div className="cdash-finance-body">
                <div className="cdash-finance-label">Outstanding commission (LKR)</div>
                <div className="cdash-finance-value">{Number(stats.outstandingCommission).toLocaleString()}</div>
              </div>
              {Number(stats.outstandingCommission) === 0 && (
                <span className="cdash-settled">All settled</span>
              )}
            </div>
          </section>
        </>
      )}

      {/* Actions */}
      <div className="cdash-actions">
        <Link className="cdash-btn cdash-btn-primary" to="/company/post">Post a job</Link>
        <Link className="cdash-btn cdash-btn-ghost" to="/company/jobs">Manage jobs</Link>
        <Link className="cdash-btn cdash-btn-ghost" to="/company/payments">Payments</Link>
        <Link className="cdash-btn cdash-btn-ghost" to="/company/staff">Staff</Link>
      </div>
    </div>
  );
}
