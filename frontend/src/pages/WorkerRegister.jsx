import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import { PASSWORD_RE, EMAIL_RE } from '../validation';
import '../auth.css';

// Sidebar stepper labels (title + sub) shown down the red panel.
const SIDE_STEPS = [
  { title: 'Details', sub: 'Your information' },
  { title: 'Documents', sub: 'NIC & proof' },
  { title: 'Verify', sub: 'Final review' },
];

const PANEL_TITLES = {
  1: 'Create your worker profile',
  2: 'Upload your documents',
  3: 'Verify your WhatsApp',
};

function ShieldGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ImageGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.6" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

// A styled document upload row: hidden native input, image icon, format hint / filename, "Choose file" button.
function FileRow({ title, hint, accept, file, onPick }) {
  return (
    <label className={`wr-file ${file ? 'has' : ''}`}>
      <span className="wr-file-icon"><ImageGlyph /></span>
      <span className="wr-file-text">
        <span className="wr-file-title">{title}</span>
        <span className="wr-file-name">{file ? file.name : hint}</span>
      </span>
      <span className="wr-file-btn">Choose file</span>
      <input type="file" accept={accept} hidden onChange={(e) => onPick(e.target.files[0])} />
    </label>
  );
}

// 3-step worker registration: details -> KYC files -> WhatsApp OTP, styled to the red/white split panel.
export default function WorkerRegister() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [districts, setDistricts] = useState([]);
  const [details, setDetails] = useState({
    fullName: '', nicNumber: '', dateOfBirth: '', email: '', whatsappNumber: '', password: '', confirmPassword: '', district: '', skills: '',
  });
  const [files, setFiles] = useState({ profilePhoto: null, nicFront: null, nicBack: null });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [err, setErr] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState(null);
  const otpRefs = useRef([]);
  const otp = otpDigits.join('');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => { api.get('/api/reference/districts').then(setDistricts).catch(() => {}); }, []);

  function fe(name) { return fieldErrors[name] && <div className="auth-err">{fieldErrors[name]}</div>; }

  const NIC_RE = /^(\d{9}[VXvx]|\d{12})$/;
  const PHONE_RE = /^07\d{8}$/;
  const step1Valid = details.fullName && NIC_RE.test(details.nicNumber) && PHONE_RE.test(details.whatsappNumber) &&
    EMAIL_RE.test(details.email) && details.district && PASSWORD_RE.test(details.password) &&
    details.confirmPassword === details.password;
  function pickPhoto(file) {
    setFiles({ ...files, profilePhoto: file });
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  // Segmented OTP: keep each box a single digit, auto-advance on entry, hop back on backspace.
  function setOtpAt(i, val) {
    const digits = val.replace(/\D/g, '');
    const next = [...otpDigits];
    if (!digits) { next[i] = ''; setOtpDigits(next); return; }
    for (let k = 0; k < digits.length && i + k < 6; k++) next[i + k] = digits[k];
    setOtpDigits(next);
    otpRefs.current[Math.min(i + digits.length, 5)]?.focus();
  }
  function onOtpKeyDown(i, e) {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }

  async function submitRegistration() {
    setErr(null); setFieldErrors({}); setBusy(true);
    try {
      const district = districts.find((d) => d.name === details.district);
      // dateOfBirth is collected in the UI but not part of the backend DTO, so it is stripped here.
      const { confirmPassword, dateOfBirth, ...rest } = details;
      const data = { ...rest, latitude: district?.centerLat, longitude: district?.centerLng };
      const fd = new FormData();
      fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
      fd.append('profilePhoto', files.profilePhoto);
      fd.append('nicFront', files.nicFront);
      fd.append('nicBack', files.nicBack);
      await api.postForm('/api/auth/register/worker', fd);
      await login(details.email, details.password);
      await api.post('/api/worker/whatsapp/send-otp');
      setStep(3);
      setResendCooldown(30);
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) {
        setFieldErrors(e.fieldErrors);
        const step1Fields = ['fullName', 'nicNumber', 'email', 'whatsappNumber', 'password', 'district'];
        if (Object.keys(e.fieldErrors).some((f) => step1Fields.includes(f))) setStep(1);
      }
      setErr(e instanceof ApiError ? e.message : 'Registration failed');
    } finally { setBusy(false); }
  }

  async function resendOtp() {
    setErr(null); setResendMsg(null); setBusy(true);
    try {
      await api.post('/api/worker/whatsapp/send-otp');
      setResendMsg('Code resent.');
      setResendCooldown(30);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not resend code');
    } finally { setBusy(false); }
  }

  async function verifyOtp() {
    setErr(null); setBusy(true);
    try {
      await api.post('/api/worker/whatsapp/verify', { otp });
      navigate('/worker/applications', { replace: true });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Verification failed');
    } finally { setBusy(false); }
  }

  const subs = {
    1: 'Step 1 of 3 — tell us who you are.',
    2: 'Step 2 of 3 — clear photos of your NIC. JPG or PNG, max 5MB each.',
    3: <>Step 3 of 3 — we sent a 6-digit code to <strong>{details.whatsappNumber || 'your WhatsApp'}</strong>.</>,
  };

  return (
    <div className="wr-canvas">
      <div className="wr-shell">
        {/* ── Left red sidebar: brand, vertical stepper, data-safety badge ── */}
        <aside className="wr-side">
          <div className="wr-brand">
            <span className="wr-mark">FW</span>
            <span className="wr-name">FlexiWork</span>
          </div>

          <div className="wr-steps">
            {SIDE_STEPS.map((s, i) => {
              const n = i + 1;
              const state = step > n ? 'done' : step === n ? 'active' : '';
              return (
                <div className={`wr-step ${state}`} key={s.title}>
                  <span className="wr-step-num">{step > n ? '✓' : n}</span>
                  <span className="wr-step-text">
                    <span className="wr-step-title">{s.title}</span>
                    <span className="wr-step-sub">{s.sub}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="wr-badge">
            <span className="wr-badge-icon"><ShieldGlyph /></span>
            <span className="wr-badge-text">
              <span className="wr-badge-title">Your data is safe</span>
              <span className="wr-badge-sub">We only share your profile with verified employers you apply to.</span>
            </span>
          </div>
        </aside>

        {/* ── Right white form panel ── */}
        <section className="wr-panel">
          <div className="wr-panel-head">
            <div>
              <h1 className="wr-title">{PANEL_TITLES[step]}</h1>
              <p className="wr-sub">{subs[step]}</p>
            </div>
            {step === 1 && (
              <div className="wr-photo-wrap">
                <label className="wr-photo">
                  {photoPreview
                    ? <img src={photoPreview} alt="" />
                    : (
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.7-8 6v1h16v-1c0-3.3-3.6-6-8-6Z" />
                      </svg>
                    )}
                  <span className="wr-photo-badge">+</span>
                  <input type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files[0])} />
                </label>
                <span className="wr-photo-label">Profile photo</span>
              </div>
            )}
          </div>

          {err && <div className="auth-msg-err">{err}</div>}

          {step === 1 && (
            <>
              <div className="wr-grid">
                <div className="wr-field wr-span-2"><label>Full name</label>
                  <input className="auth-input" placeholder="e.g. Nimal Perera" maxLength={80} value={details.fullName}
                    onChange={(e) => setDetails({ ...details, fullName: e.target.value })} />{fe('fullName')}</div>

                <div className="wr-field"><label>NIC number</label>
                  <input className="auth-input" placeholder="991234567V" maxLength={12} value={details.nicNumber}
                    onChange={(e) => setDetails({ ...details, nicNumber: e.target.value.toUpperCase() })} />
                  {details.nicNumber && !NIC_RE.test(details.nicNumber) &&
                    <div className="auth-err">Enter a valid NIC: 9 digits + letter, or 12 digits</div>}{fe('nicNumber')}</div>

                <div className="wr-field"><label>Date of birth</label>
                  <input className="auth-input" type="date" value={details.dateOfBirth}
                    onChange={(e) => setDetails({ ...details, dateOfBirth: e.target.value })} /></div>

                <div className="wr-field"><label>WhatsApp</label>
                  <input className="auth-input" placeholder="0712345678" maxLength={10} value={details.whatsappNumber}
                    onChange={(e) => setDetails({ ...details, whatsappNumber: e.target.value.replace(/\D/g, '') })} />
                  {details.whatsappNumber && !PHONE_RE.test(details.whatsappNumber) &&
                    <div className="auth-err">Enter a valid number starting with 07, 10 digits</div>}{fe('whatsappNumber')}</div>

                <div className="wr-field"><label>Email</label>
                  <input className="auth-input" type="email" maxLength={120} placeholder="name@example.com" value={details.email}
                    onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                  {details.email && !EMAIL_RE.test(details.email) &&
                    <div className="auth-err">Enter a valid email address</div>}{fe('email')}</div>

                <div className="wr-field"><label>District</label>
                  <select className="auth-input" value={details.district} onChange={(e) => setDetails({ ...details, district: e.target.value })}>
                    <option value="">Select…</option>
                    {districts.map((d) => <option key={d.name} value={d.name}>{d.name.replaceAll('_', ' ')}</option>)}
                  </select>{fe('district')}</div>

                <div className="wr-field"><label>Skills <span className="wr-opt">· optional</span></label>
                  <input className="auth-input" placeholder="Driving, packing…" maxLength={200} value={details.skills}
                    onChange={(e) => setDetails({ ...details, skills: e.target.value })} /></div>

                <div className="wr-field"><label>Password</label>
                  <div className="auth-pwd-wrap">
                    <input className="auth-input" type={showPw ? 'text' : 'password'} maxLength={13} value={details.password}
                      onChange={(e) => setDetails({ ...details, password: e.target.value })} />
                    <button type="button" className="wr-show-btn" onClick={() => setShowPw((v) => !v)}>
                      {showPw ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  <p className="auth-hint">8–13 characters, mixing letters and numbers.</p>
                  {details.password && !PASSWORD_RE.test(details.password) &&
                    <div className="auth-err">Password must be 8-13 letters/numbers, with at least one letter and one number</div>}{fe('password')}</div>

                <div className="wr-field"><label>Confirm password</label>
                  <div className="auth-pwd-wrap">
                    <input className="auth-input" type={showConfirmPw ? 'text' : 'password'} maxLength={13} value={details.confirmPassword}
                      onChange={(e) => setDetails({ ...details, confirmPassword: e.target.value })} />
                    <button type="button" className="wr-show-btn" onClick={() => setShowConfirmPw((v) => !v)}>
                      {showConfirmPw ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  {details.confirmPassword && details.confirmPassword !== details.password &&
                    <div className="auth-err">Passwords do not match</div>}{fe('confirmPassword')}</div>
              </div>

              <button className="auth-btn" disabled={!step1Valid || !files.profilePhoto} onClick={() => setStep(2)}>
                Continue to documents →
              </button>

              <div className="auth-foot">Already registered? <a href="/login">Log in</a></div>
            </>
          )}

          {step === 2 && (
            <>
              <FileRow title="NIC — front" hint="No file chosen" accept="image/*"
                file={files.nicFront} onPick={(f) => setFiles({ ...files, nicFront: f })} />
              <FileRow title="NIC — back" hint="No file chosen" accept="image/*"
                file={files.nicBack} onPick={(f) => setFiles({ ...files, nicBack: f })} />

              <div className="wr-note">
                <span className="wr-note-check">✓</span>
                We'll send a verification code to your WhatsApp after you submit.
              </div>

              <button className="auth-btn" disabled={busy || !files.nicFront || !files.nicBack} onClick={submitRegistration}>
                {busy ? 'Submitting…' : 'Submit & verify WhatsApp'}
              </button>
              <button className="auth-btn-ghost" onClick={() => setStep(1)}>← Back</button>

              <div className="auth-foot">Already registered? <a href="/login">Log in</a></div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="wr-field"><label>Verification code</label>
                <div className="wr-otp">
                  {otpDigits.map((d, i) => (
                    <input key={i} ref={(el) => { otpRefs.current[i] = el; }} className="wr-otp-box"
                      inputMode="numeric" maxLength={1} value={d} disabled={busy}
                      onChange={(e) => setOtpAt(i, e.target.value)} onKeyDown={(e) => onOtpKeyDown(i, e)} />
                  ))}
                </div>
              </div>
              <p className="auth-hint">{resendMsg || 'Enter the code exactly as received.'}</p>

              <button className="auth-btn" disabled={busy || otp.length < 6} onClick={verifyOtp}>
                {busy ? 'Verifying…' : 'Verify & finish'}
              </button>
              <div className="wr-btn-row">
                <button className="auth-btn-ghost wr-ghost-red" disabled={busy || resendCooldown > 0} onClick={resendOtp}>
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                </button>
                <button className="auth-btn-ghost" onClick={() => navigate('/worker/applications')}>Skip for now</button>
              </div>

              <div className="wr-foot-row">
                <button className="wr-back-link" onClick={() => setStep(2)}>← Back</button>
                <span>Already registered? <a href="/login">Log in</a></span>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
