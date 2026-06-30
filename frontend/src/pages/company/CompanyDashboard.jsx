import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import '../../styles.css';

const POLL_MS = 20_000;

const JOB_STATS = [
  { key: 'totalJobs', label: 'Total jobs', tone: 'tone-ink' },
  { key: 'openJobs', label: 'Open', tone: 'tone-green' },
  { key: 'filledJobs', label: 'Filled', tone: 'tone-blue' },
  { key: 'completedJobs', label: 'Completed', tone: 'tone-purple' },
  { key: 'cancelledJobs', label: 'Cancelled', tone: 'tone-red' },
  { key: 'workersPaid', label: 'Workers paid', tone: 'tone-amber' },
];

export default function CompanyDashboard() {
  const [stats, setStats] = useState(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const firstLoad = useRef(true);

  // ── Data: load once + poll on an interval ──
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

  // Stat-strip value + tone helper (presentational only).
  function statValue(s) {
    const val = Number(stats?.[s.key]) || 0;
    return { raw: stats?.[s.key], on: val > 0 };
  }

  // ── Derived display values (presentational only) ──
  const logoInitial = (company?.companyName || '?').charAt(0).toUpperCase();
  const brPreview = company?.brNumber || '—';
  const districtLabel = company?.district?.replaceAll('_', ' ') || '—';
  const addressPreview = company?.addressLine || '—';
  const approvedPreview = (() => {
    if (!company?.approvedAt) return 'Not yet';
    const dt = new Date(company.approvedAt);
    return Number.isNaN(dt.getTime()) ? 'Not yet' : dt.toLocaleDateString();
  })();
  const commissionPreview = Number(stats?.outstandingCommission).toLocaleString();
  const isSettled = Number(stats?.outstandingCommission) === 0;

  return (
    <div className="page cdash">
      {/* Header strip: brand + live */}
      <div className="cdash-header">
        <div className="cdash-brand">
          <div className="cdash-logo">
            {company?.logoPath && !logoFailed
              ? <img src={company.logoPath} alt={company.companyName} onError={() => setLogoFailed(true)} />
              : <span>{logoInitial}</span>}
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
                <span className="cdash-meta-value">{brPreview}</span>
              </div>
              <div className="cdash-meta-item">
                <span className="cdash-meta-label">District</span>
                <span className="cdash-meta-value">{districtLabel}</span>
              </div>
              <div className="cdash-meta-item">
                <span className="cdash-meta-label">Address</span>
                <span className="cdash-meta-value">{addressPreview}</span>
              </div>
              <div className="cdash-meta-item">
                <span className="cdash-meta-label">Verified on</span>
                <span className={`cdash-meta-value ${company.approvedAt ? '' : 'is-muted'}`}>
                  {approvedPreview}
                </span>
              </div>
            </div>
          )}

          {/* Job overview strip */}
          <section className="cdash-section">
            <h4 className="cd-eyebrow">Job overview</h4>
            <div className="cdash-stat-strip">
              {JOB_STATS.map((s) => {
                const { raw, on } = statValue(s);
                return (
                  <div key={s.key} className="cdash-stat">
                    <div className="cdash-stat-label">{s.label}</div>
                    <div className={`cdash-stat-value ${on ? 'is-on' : 'is-zero'}`}>{raw}</div>
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
                <div className="cdash-finance-value">{commissionPreview}</div>
              </div>
              {isSettled && (
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
