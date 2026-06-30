import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../../api';
import { useAuth } from '../../auth';
import ConfirmDialog from '../../components/ConfirmDialog';
import './WorkerDashboard.css';

// ── ICONS ──
const IcoHome     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><polyline points="9 21 9 12 15 12 15 21"/></svg>;
const IcoHistory  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>;
const IcoProfile  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoLock     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcoCal      = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoPin      = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcoCheck    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX        = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoBag      = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
const IcoEye      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoCircle   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/></svg>;
const IcoCheckSm  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

// ── HELPERS ──
function initials(name, email) {
  if (name) return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (email?.[0] || '?').toUpperCase();
}

function getCategory(a) {
  const cat = (a.category || '').toLowerCase();
  if (['factory', 'restaurant', 'marketing', 'retail', 'security'].includes(cat)) return cat;
  const t = (a.jobTitle || '').toLowerCase();
  if (/factory|warehouse|production|packing/.test(t)) return 'factory';
  if (/restaurant|food|cook|chef|cafe|hotel/.test(t)) return 'restaurant';
  if (/marketing|sales|promo/.test(t)) return 'marketing';
  if (/retail|cashier|shop|store/.test(t)) return 'retail';
  if (/security|guard/.test(t)) return 'security';
  return 'other';
}

const CAT_LABELS = { factory: 'Factory', restaurant: 'Restaurant', marketing: 'Marketing', retail: 'Retail', security: 'Security', other: 'General' };

function StatusPill({ status }) {
  const cls = { PENDING: 'wd-s-pending', ACCEPTED: 'wd-s-approved', COMPLETED: 'wd-s-completed', ATTENDED: 'wd-s-completed', CANCELLED: 'wd-s-cancelled' };
  return <span className={`wd-spill ${cls[status] || 'wd-s-pending'}`}>{status}</span>;
}

// ── ROOT ──
export default function WorkerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('home');
  const [apps, setApps] = useState(null);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(msg, type = 'success') {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  function load() {
    api.get('/api/applications/mine').then(setApps).catch(() => setApps([]));
    api.get('/api/worker/dashboard').then(setStats).catch(() => {});
    api.get('/api/worker/profile').then(setProfile).catch(() => {});
    api.get('/api/reference/districts').then(setDistricts).catch(() => {});
  }
  useEffect(load, []);

  if (!apps || !profile) return (
    <div className="page"><div className="skeleton skel-card" /></div>
  );

  // A job the company has completed/settled OR cancelled is "ended": it leaves Enrolled Jobs and
  // shows up in Job History — even though the application row itself is still ACCEPTED.
  const isActive    = a => ['PENDING', 'ACCEPTED'].includes(a.status)
    && a.jobStatus !== 'COMPLETED' && a.jobStatus !== 'CANCELLED';
  const activeApps  = apps.filter(isActive);
  const historyApps = apps.filter(a => !isActive(a));
  const ini = initials(profile.fullName, user?.email);

  const TABS = [
    { id: 'home',     Icon: IcoHome,    label: 'Current Jobs' },
    { id: 'history',  Icon: IcoHistory, label: 'Job History' },
    { id: 'profile',  Icon: IcoProfile, label: 'Profile' },
    { id: 'password', Icon: IcoLock,    label: 'Change Password' },
  ];

  return (
    <div className="page wd-page">

      {/* WELCOME BANNER */}
      <div className="wd-banner">
        <div className="wd-banner-row">
          <div className="wd-banner-left">
            <div className="wd-banner-avatar">{ini}</div>
            <div>
              <div className="wd-banner-name">Welcome, {profile.fullName || user?.email}!</div>
              <div className="wd-banner-sub">
                Worker Dashboard
                {profile.status !== 'VERIFIED' && (
                  <span className="wd-banner-badge">⏳ {profile.status}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="wd-banner-stats">
          <div className="wd-bstat">
            {/* Count the same in-progress jobs shown under Current Jobs, so the banner stays
                consistent with the list and excludes completed/cancelled jobs immediately. */}
            <div className="wd-bstat-num">{activeApps.length}</div>
            <div className="wd-bstat-lbl">Enrolled Jobs</div>
          </div>
          <div className="wd-bstat">
            <div className="wd-bstat-num">{stats?.completedJobs ?? '–'}</div>
            <div className="wd-bstat-lbl">Completed</div>
          </div>
          <div className="wd-bstat">
            <div className="wd-bstat-num">{stats ? Number(stats.totalEarned).toLocaleString() : '–'}</div>
            <div className="wd-bstat-lbl">Total Earned (LKR)</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="wd-tabs-wrap">
        <div className="wd-tabs">
          {TABS.map(({ id, Icon, label }) => (
            <button key={id} className={`wd-tab-btn${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
              <Icon />{label}
            </button>
          ))}
        </div>
      </div>

      {/* PANELS */}
      <div className="wd-panel">
        {tab === 'home'     && <CurrentJobsPanel apps={activeApps} onRefresh={load} showToast={showToast} />}
        {tab === 'history'  && <HistoryPanel apps={historyApps} totalEarned={stats?.totalEarned} completedCount={stats?.completedJobs ?? 0} />}
        {tab === 'profile'  && <ProfilePanel profile={profile} districts={districts} onSaved={p => { setProfile(p); showToast('Profile updated.'); }} showToast={showToast} />}
        {tab === 'password' && <PasswordPanel email={user?.email} showToast={showToast} />}
      </div>

      {/* TOAST */}
      <div className={`wd-toast${toast ? ' show' : ''} ${toast?.type || ''}`}>{toast?.msg}</div>
    </div>
  );
}

// ── CURRENT JOBS ──
function CurrentJobsPanel({ apps, onRefresh, showToast }) {
  const [cancelId, setCancelId] = useState(null);

  async function cancel() {
    const id = cancelId; setCancelId(null);
    try {
      await api.post(`/api/applications/${id}/cancel`);
      onRefresh();
      showToast('Application cancelled.');
    } catch (e) {
      const msg = e.message || '';
      if (msg.toLowerCase().includes('cannot be cancelled within')) {
        showToast('Cannot cancel — the shift starts in less than 2 hours.', 'error');
      } else {
        showToast(msg || 'Failed to cancel application.', 'error');
      }
    }
  }

  async function downloadQr(a) {
    try {
      const blob = await api.get(a.qrImageUrl);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flexiwork-qr-${a.jobTitle.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch { showToast('Download failed.', 'error'); }
  }

  function shareQr(a) {
    const qrAbs = window.location.origin + a.qrImageUrl;
    const text = `My FlexiWork check-in QR for "${a.jobTitle}" on ${a.jobDate}:\n${qrAbs}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  if (apps.length === 0) return (
    <div className="wd-empty">
      <div className="wd-empty-icon"><IcoBag /></div>
      <div className="wd-empty-title">No active jobs</div>
      <p>Browse the job feed and apply to get started.</p>
    </div>
  );

  return (
    <>
      <div className="wd-sec-head">
        <span className="wd-sec-title">Enrolled Jobs</span>
        <span className="wd-sec-count">{apps.length}</span>
      </div>
      <div className="wd-jobs-list">
        {apps.map(a => (
          <div key={a.id} className="wd-job-card">
            <span className={`wd-job-cat wd-cat-${getCategory(a)}`}>{CAT_LABELS[getCategory(a)]}</span>
            <div className="wd-job-main">
              <div className="wd-job-title">{a.jobTitle}</div>
              <div className="wd-job-co">{a.companyName}</div>
              <div className="wd-job-meta">
                <span className="wd-job-meta-item"><IcoCal /> {a.jobDate}</span>
                {a.addressLine && (
                  <span className="wd-job-meta-item">
                    <IcoPin />
                    {a.mapsLink
                      ? <a href={a.mapsLink} target="_blank" rel="noreferrer">{a.addressLine} ↗</a>
                      : a.addressLine}
                  </span>
                )}
              </div>

              {a.status === 'ACCEPTED' && a.qrImageUrl && (
                <div className="wd-qr-box">
                  <p className="wd-qr-hint">Show this QR at check-in / check-out</p>
                  <img src={a.qrImageUrl} alt="Check-in QR code" />
                  <div className="wd-qr-btns">
                    <button className="wd-btn wd-btn-ghost wd-btn-sm" onClick={() => downloadQr(a)}>⬇ Download QR</button>
                    <button className="wd-btn wd-btn-primary wd-btn-sm" onClick={() => shareQr(a)}>↗ Share to WhatsApp</button>
                  </div>
                </div>
              )}

              {(a.status === 'PENDING' || a.status === 'ACCEPTED') && (
                <button className="wd-btn wd-btn-danger wd-btn-sm" style={{ marginTop: 12 }} onClick={() => setCancelId(a.id)}>
                  Cancel application
                </button>
              )}
            </div>
            <div className="wd-job-right">
              <div className="wd-job-wage"><b>LKR</b>{Number(a.dailyWage).toLocaleString()}</div>
              <StatusPill status={a.status} />
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!cancelId}
        title="Cancel application?"
        message="The company will be notified that you're no longer applying for this shift."
        confirmLabel="Cancel application"
        onConfirm={cancel}
        onCancel={() => setCancelId(null)}
      />
    </>
  );
}

// ── JOB HISTORY ──
function HistoryPanel({ apps, totalEarned, completedCount }) {
  return (
    <>
      <div className="wd-earnings-banner">
        <div className="wd-eb-label">Total Earnings</div>
        <div className="wd-eb-amount"><small>LKR</small>{totalEarned ? Number(totalEarned).toLocaleString() : '0'}</div>
        <div className="wd-eb-sub">From {completedCount} completed shift{completedCount !== 1 ? 's' : ''}</div>
      </div>

      {apps.length === 0 ? (
        <div className="wd-empty">
          <div className="wd-empty-icon"><IcoHistory /></div>
          <div className="wd-empty-title">No job history yet</div>
          <p>Completed and cancelled jobs will appear here.</p>
        </div>
      ) : (
        <>
          <div className="wd-sec-head">
            <span className="wd-sec-title">Job History</span>
          </div>
          <div className="wd-history-list">
            {apps.map(a => {
              // Reflect the job outcome even though the application row stays ACCEPTED:
              // a finished job reads COMPLETED, a company-cancelled job reads CANCELLED.
              const eff = a.jobStatus === 'COMPLETED' ? 'COMPLETED'
                : a.jobStatus === 'CANCELLED' ? 'CANCELLED'
                : a.status;
              const ended = eff === 'CANCELLED' || eff === 'REJECTED';
              return (
              <div key={a.id} className="wd-history-card">
                <div className={`wd-hist-icon${ended ? ' wd-cancelled' : ''}`}>
                  {ended ? <IcoX /> : <IcoCheck />}
                </div>
                <div className="wd-hist-main">
                  <div className="wd-hist-title">{a.jobTitle}</div>
                  <div className="wd-hist-co">{a.companyName}</div>
                  <div className="wd-hist-meta">{a.jobDate}</div>
                </div>
                <div className="wd-hist-right">
                  {!ended && (
                    <div className="wd-hist-wage"><b>LKR</b>{Number(a.dailyWage).toLocaleString()}</div>
                  )}
                  <StatusPill status={eff} />
                </div>
              </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// ── PROFILE ──
function ProfilePanel({ profile, districts, onSaved, showToast }) {
  const [form, setForm] = useState({
    fullName: profile.fullName || '',
    district: profile.district || '',
    skills:   profile.skills   || '',
    latitude:  profile.latitude  ?? null,
    longitude: profile.longitude ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const ini = initials(form.fullName, null) || '?';

  async function save(e) {
    e.preventDefault(); setSaving(true); setFieldErrors({});
    try {
      const d = districts.find(x => x.name === form.district);
      const body = { ...form, latitude: form.latitude ?? d?.centerLat, longitude: form.longitude ?? d?.centerLng };
      const updated = await api.put('/api/worker/profile', body);
      onSaved(updated);
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors || {}).length) setFieldErrors(e.fieldErrors);
      showToast(e instanceof ApiError ? e.message : 'Update failed.', 'error');
    } finally { setSaving(false); }
  }

  async function uploadPhoto(file) {
    try {
      const fd = new FormData(); fd.append('photo', file);
      const updated = await api.postForm('/api/worker/profile/photo', fd);
      onSaved(updated);
    } catch { showToast('Photo upload failed.', 'error'); }
  }

  return (
    <div className="wd-form-card">
      <div className="wd-avatar-row">
        {profile.profilePhotoPath
            ? <img src={profile.profilePhotoPath.startsWith('http') ? profile.profilePhotoPath : `/api/files/${profile.profilePhotoPath}`} alt="" className="wd-profile-avatar" style={{ objectFit: 'cover' }} />
          : <div className="wd-profile-avatar">{ini}</div>}
        <div className="wd-avatar-meta">
          <div className="wd-avatar-name">{form.fullName || '—'}</div>
          <div className="wd-avatar-id">Worker · {profile.status}</div>
        </div>
        <label className="wd-btn wd-btn-ghost" style={{ cursor: 'pointer' }}>
          Change Photo
          <input type="file" accept="image/*" hidden onChange={e => e.target.files[0] && uploadPhoto(e.target.files[0])} />
        </label>
      </div>

      <div className="wd-form-card-title"><IcoProfile /> Personal Details</div>

      <form onSubmit={save}>
        <div className="wd-profile-grid">
          <div className="wd-fld">
            <label>Full Name</label>
            <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Your full name" />
            {fieldErrors.fullName && <div className="wd-field-error">{fieldErrors.fullName}</div>}
          </div>
          <div className="wd-fld">
            <label>NIC Number (locked)</label>
            <input value={profile.nicNumber || ''} disabled />
          </div>
          <div className="wd-fld">
            <WhatsappField profile={profile} onSaved={onSaved} showToast={showToast} />
          </div>
          <div className="wd-fld">
            <label>District</label>
            <select value={form.district} onChange={e => setForm({ ...form, district: e.target.value, latitude: null, longitude: null })}>
              {districts.map(d => (
                <option key={d.name} value={d.name}>{d.name.replaceAll('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="wd-fld wd-full">
            <label>Skills / Notes</label>
            <textarea rows={3} value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="e.g. Forklift operator, cashier experience, food handling certificate…" />
            <span className="wd-fld-note">Helps companies match you to the right shifts.</span>
          </div>
        </div>
        <div className="wd-form-actions">
          <button className="wd-btn wd-btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          <button className="wd-btn wd-btn-ghost" type="button"
            onClick={() => setForm({ fullName: profile.fullName || '', district: profile.district || '', skills: profile.skills || '', latitude: profile.latitude ?? null, longitude: profile.longitude ?? null })}>
            Discard
          </button>
        </div>
      </form>
    </div>
  );
}

// ── WHATSAPP NUMBER (with change-number OTP flow) ──
function WhatsappField({ profile, onSaved, showToast }) {
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(1);
  const [newNumber, setNewNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  function cancel() {
    setEditing(false); setStep(1); setNewNumber(''); setOtp('');
  }

  async function sendOtp(e) {
    e.preventDefault(); setBusy(true);
    try {
      await api.post('/api/worker/whatsapp/change/request', { newNumber });
      showToast('Verification code sent to the new number via WhatsApp.');
      setStep(2);
    } catch (e) { showToast(e instanceof ApiError ? e.message : 'Could not send code.', 'error'); }
    finally { setBusy(false); }
  }

  async function confirm(e) {
    e.preventDefault(); setBusy(true);
    try {
      await api.post('/api/worker/whatsapp/change/confirm', { otp });
      onSaved({ ...profile, whatsappNumber: '+94' + newNumber.slice(1), whatsappVerified: true });
      showToast('WhatsApp number updated.');
      cancel();
    } catch (e) { showToast(e instanceof ApiError ? e.message : 'Verification failed.', 'error'); }
    finally { setBusy(false); }
  }

  if (!editing) {
    return (
      <>
        <label>WhatsApp {profile.whatsappVerified ? '✅ Verified' : '⚠️ Unverified'}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={profile.whatsappNumber || ''} disabled style={{ flex: 1 }} />
          <button type="button" className="wd-btn wd-btn-ghost" onClick={() => setEditing(true)}>Change</button>
        </div>
      </>
    );
  }

  return step === 1 ? (
    <form onSubmit={sendOtp}>
      <label>New WhatsApp number</label>
      <input value={newNumber} maxLength={10} placeholder="07XXXXXXXX"
        onChange={(e) => setNewNumber(e.target.value.replace(/\D/g, ''))} required />
      <div className="wd-form-actions" style={{ marginTop: 8 }}>
        <button className="wd-btn wd-btn-primary" type="submit" disabled={busy || !/^07\d{8}$/.test(newNumber)}>
          {busy ? 'Sending…' : 'Send code'}
        </button>
        <button className="wd-btn wd-btn-ghost" type="button" onClick={cancel}>Cancel</button>
      </div>
    </form>
  ) : (
    <form onSubmit={confirm}>
      <label>Code sent to {newNumber}</label>
      <input value={otp} placeholder="123456" onChange={(e) => setOtp(e.target.value)} required />
      <div className="wd-form-actions" style={{ marginTop: 8 }}>
        <button className="wd-btn wd-btn-primary" type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify & save'}</button>
        <button className="wd-btn wd-btn-ghost" type="button" onClick={cancel}>Cancel</button>
      </div>
    </form>
  );
}

// ── CHANGE PASSWORD ──
function PasswordPanel({ email, showToast }) {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    setLoading(true);
    try {
      await api.post('/api/auth/password/forgot', { email });
      setStep(2);
      showToast('Reset code sent to your email.');
    } catch (e) { showToast(e instanceof ApiError ? e.message : 'Failed to send code.', 'error'); }
    finally { setLoading(false); }
  }

  async function submit(e) {
    e.preventDefault();
    if (newPwd !== confirmPwd) { showToast('Passwords do not match.', 'error'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/password/reset', { email, otp, newPassword: newPwd });
      showToast('Password changed successfully!');
      setStep(1); setOtp(''); setNewPwd(''); setConfirmPwd('');
    } catch (e) { showToast(e instanceof ApiError ? e.message : 'Failed to reset password.', 'error'); }
    finally { setLoading(false); }
  }

  const checks = {
    len:    newPwd.length >= 8 && newPwd.length <= 13,
    letter: /[A-Za-z]/.test(newPwd),
    num:    /[0-9]/.test(newPwd),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Strong'];
  const STRENGTH_COLORS = ['', '#EB1700', '#D97706', '#1F8A5B'];

  function reset() { setStep(1); setOtp(''); setNewPwd(''); setConfirmPwd(''); }

  return (
    <div className="wd-form-card wd-form-card-narrow">
      <div className="wd-form-card-title"><IcoLock /> Change Password</div>

      {step === 1 ? (
        <div>
          <p style={{ fontSize: 14, color: '#767676', marginBottom: 20, lineHeight: 1.5 }}>
            We'll send a one-time reset code to <strong>{email}</strong>
          </p>
          <button className="wd-btn wd-btn-primary" onClick={requestCode} disabled={loading}>
            {loading ? 'Sending…' : 'Email me a reset code'}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="wd-fld">
            <label>Reset Code (from email)</label>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter the code from your email" required />
          </div>

          <div className="wd-fld">
            <label>New Password</label>
            <div className="wd-pwd-eye">
              <input type={showNew ? 'text' : 'password'} maxLength={13} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Choose a strong password" required />
              <button type="button" className="wd-eye-toggle" onClick={() => setShowNew(v => !v)}><IcoEye /></button>
            </div>
            {newPwd && (
              <div className="wd-pwd-strength">
                <div className="wd-pwd-bars">
                  {[1,2,3].map(i => (
                    <div key={i} className="wd-pwd-bar" style={{ background: i <= score ? STRENGTH_COLORS[score] : undefined }} />
                  ))}
                </div>
                <span className="wd-pwd-strength-label" style={{ color: STRENGTH_COLORS[score] }}>{STRENGTH_LABELS[score]}</span>
              </div>
            )}
            <div className="wd-pwd-rules">
              {[['len','8-13 characters'],['letter','One letter'],['num','One number']].map(([k,label]) => (
                <div key={k} className={`wd-pwd-rule${checks[k] ? ' met' : ''}`}>
                  {checks[k] ? <IcoCheckSm /> : <IcoCircle />} {label}
                </div>
              ))}
            </div>
          </div>

          <div className="wd-fld">
            <label>Confirm New Password</label>
            <div className="wd-pwd-eye">
              <input type={showConfirm ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Re-enter your new password" required />
              <button type="button" className="wd-eye-toggle" onClick={() => setShowConfirm(v => !v)}><IcoEye /></button>
            </div>
            {confirmPwd && (
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 5, color: confirmPwd === newPwd ? '#1F8A5B' : '#EB1700' }}>
                {confirmPwd === newPwd ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}
          </div>

          <div className="wd-form-actions">
            <button className="wd-btn wd-btn-primary" type="submit" disabled={loading}>{loading ? 'Updating…' : 'Update Password'}</button>
            <button className="wd-btn wd-btn-ghost" type="button" onClick={reset}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
