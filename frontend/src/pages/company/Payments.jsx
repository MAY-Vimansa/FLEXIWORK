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

  const FILTERS = [['', 'All'], ['PENDING', 'Pending'], ['PAID', 'Paid']];

  return (
    <div className="page">
      {/* Header */}
      <div className="pay-header">
        <h1 className="pay-title">Payments</h1>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="pay-summary">
          <div className="pay-sum-card">
            <div className="pay-sum-label">Pending</div>
            <div className="pay-sum-value">{summary.pendingCount}</div>
          </div>
          <div className="pay-sum-card is-outstanding">
            <div className="pay-sum-label">Outstanding · LKR</div>
            <div className="pay-sum-value">{Number(summary.totalOutstanding).toLocaleString()}</div>
          </div>
          <div className="pay-sum-card">
            <div className="pay-sum-label">Total paid · LKR</div>
            <div className="pay-sum-value">{Number(summary.totalPaid).toLocaleString()}</div>
          </div>
        </div>
      )}

      {err && <div className="form-error mt-16">{err}</div>}

      {/* Toolbar: filter + count */}
      <div className="pay-toolbar">
        <div className="pay-filter">
          {FILTERS.map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`pay-filter-btn ${status === val ? 'is-active' : ''}`}
              onClick={() => setStatus(val)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="pay-count">{payments ? payments.length : 0} records</span>
      </div>

      {/* List / states */}
      {!payments ? (
        <div className="skeleton skel-card mt-16" />
      ) : payments.length === 0 ? (
        <div className="pay-empty">
          <div className="pay-empty-icon">Rs</div>
          <div className="pay-empty-title">No payments yet</div>
          <div className="pay-empty-sub">Payments will appear here once jobs are completed.</div>
        </div>
      ) : (
        <div className="pay-list">
          {payments.map((p) => (
            <div key={p.id} className="pay-row">
              <div className="pay-row-main">
                <div className="pay-row-job">{p.jobTitle}</div>
                <div className="pay-row-meta">
                  Receipt {p.receiptNumber} · <span className={`badge ${p.status}`}>{p.status}</span>
                </div>
              </div>
              <div className="pay-row-amount">
                <div className="pay-row-label">Commission · LKR</div>
                <div className="pay-row-value">{Number(p.commissionAmount).toLocaleString()}</div>
              </div>
              <div className="pay-row-actions">
                {p.status === 'PENDING' && (
                  <Link className="pay-btn pay-btn-primary" to={`/company/payments/${p.id}/pay`}>Pay</Link>
                )}
                <button
                  className="pay-btn pay-btn-ghost"
                  disabled={downloadingId === p.id}
                  onClick={() => download(p.id)}
                >
                  {downloadingId === p.id ? 'Downloading…' : p.status === 'PAID' ? 'Receipt' : 'Invoice'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
