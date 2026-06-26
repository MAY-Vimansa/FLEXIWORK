import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import { PASSWORD_RE, EMAIL_RE } from '../validation';
import '../auth.css';

function EyeIcon({ open }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// 3-step worker registration: details -> KYC files -> WhatsApp OTP, styled to the red/white mockup.
export default function WorkerRegister() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [districts, setDistricts] = useState([]);
  const [details, setDetails] = useState({
    fullName: '', nicNumber: '', email: '', whatsappNumber: '', password: '', confirmPassword: '', district: '', skills: '',
  });
  const [files, setFiles] = useState({ profilePhoto: null, nicFront: null, nicBack: null });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState(null);

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

  async function submitRegistration() {
    setErr(null); setFieldErrors({}); setBusy(true);
    try {
      const district = districts.find((d) => d.name === details.district);
      const { confirmPassword, ...rest } = details;
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

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-brand"><span className="auth-mark">FW</span>
            <span className="auth-name">FlexiWork</span></div>
          <div className="steps">
            {['Details', 'Documents', 'Verify'].map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`step ${step >= i + 1 ? 'done' : ''}`}>
                  <span className="step-num">{i + 1}</span>{label}
                </div>
                {i < 2 && <span className="step-connector" />}
              </div>
            ))}
          </div>
        </div>

        {/* Avatar overlapping the header (step 1/2) */}
        {step !== 3 && (
          <>
            <div className="avatar-wrap">
              <label className="avatar">
                {photoPreview ? <img src={photoPreview} alt="" /> : <span style={{ fontSize: 26 }}>📷</span>}
                <span className="avatar-cam">+</span>
                <input type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files[0])} />
              </label>
            </div>
            <div className="avatar-label">Tap to upload your profile photo</div>
          </>
        )}

        <div className="auth-body">
          {err && <div className="auth-msg-err">{err}</div>}

          {step === 1 && (
            <>
              <div className="auth-field"><label>Full name</label>
                <input className="auth-input" maxLength={80} value={details.fullName} onChange={(e) => setDetails({ ...details, fullName: e.target.value })} />{fe('fullName')}</div>
              <div className="auth-grid-2">
                <div className="auth-field"><label>NIC number</label>
                  <input className="auth-input" placeholder="991234567V or 199912345678" maxLength={12} value={details.nicNumber}
                    onChange={(e) => setDetails({ ...details, nicNumber: e.target.value.toUpperCase() })} />
                  {details.nicNumber && !NIC_RE.test(details.nicNumber) &&
                    <div className="auth-err">Enter a valid NIC: 9 digits + letter, or 12 digits</div>}{fe('nicNumber')}</div>
                <div className="auth-field"><label>WhatsApp (07XXXXXXXX)</label>
                  <input className="auth-input" placeholder="0712345678" maxLength={10} value={details.whatsappNumber}
                    onChange={(e) => setDetails({ ...details, whatsappNumber: e.target.value.replace(/\D/g, '') })} />
                  {details.whatsappNumber && !PHONE_RE.test(details.whatsappNumber) &&
                    <div className="auth-err">Enter a valid number starting with 07, 10 digits</div>}{fe('whatsappNumber')}</div>
              </div>
              <div className="auth-field"><label>Email</label>
                <input className="auth-input" type="email" maxLength={120} placeholder="name@example.com" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                {details.email && !EMAIL_RE.test(details.email) &&
                  <div className="auth-err">Enter a valid email address</div>}{fe('email')}</div>
              <div className="auth-grid-2">
                <div className="auth-field"><label>District</label>
                  <select className="auth-input" value={details.district} onChange={(e) => setDetails({ ...details, district: e.target.value })}>
                    <option value="">Select…</option>
                    {districts.map((d) => <option key={d.name} value={d.name}>{d.name.replaceAll('_', ' ')}</option>)}
                  </select>{fe('district')}</div>
                <div className="auth-field"><label>Skills (optional)</label>
                  <input className="auth-input" maxLength={200} value={details.skills} onChange={(e) => setDetails({ ...details, skills: e.target.value })} /></div>
              </div>
              <div className="auth-field"><label>Password</label>
                <div className="auth-pwd-wrap">
                  <input className="auth-input" type={showPw ? 'text' : 'password'} maxLength={13} value={details.password} onChange={(e) => setDetails({ ...details, password: e.target.value })} />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
                {details.password && !PASSWORD_RE.test(details.password) &&
                  <div className="auth-err">Password must be 8-13 letters/numbers only, with at least one letter and one number</div>}
                <p className="auth-hint">8-13 characters, mixing letters and numbers</p>{fe('password')}</div>
              <div className="auth-field"><label>Confirm password</label>
                <div className="auth-pwd-wrap">
                  <input className="auth-input" type={showConfirmPw ? 'text' : 'password'} maxLength={13} value={details.confirmPassword} onChange={(e) => setDetails({ ...details, confirmPassword: e.target.value })} />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPw(v => !v)} aria-label={showConfirmPw ? 'Hide password' : 'Show password'}>
                    <EyeIcon open={showConfirmPw} />
                  </button>
                </div>
                {details.confirmPassword && details.confirmPassword !== details.password &&
                  <div className="auth-err">Passwords do not match</div>}{fe('confirmPassword')}</div>
              <button className="auth-btn" onClick={() => setStep(2)}
                disabled={!step1Valid || !files.profilePhoto}>
                Continue to documents
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="auth-hint">Upload clear photos of your NIC. JPG/PNG, max 5MB each.</p>
              <div className="auth-field"><label>NIC — front</label>
                <input className="auth-input" type="file" accept="image/*" onChange={(e) => setFiles({ ...files, nicFront: e.target.files[0] })} />
                {files.nicFront && <div className="auth-file-chip">📄 {files.nicFront.name}</div>}</div>
              <div className="auth-field"><label>NIC — back</label>
                <input className="auth-input" type="file" accept="image/*" onChange={(e) => setFiles({ ...files, nicBack: e.target.files[0] })} />
                {files.nicBack && <div className="auth-file-chip">📄 {files.nicBack.name}</div>}</div>
              <button className="auth-btn" disabled={busy || !files.nicFront || !files.nicBack} onClick={submitRegistration}>
                {busy ? 'Submitting…' : 'Submit & verify WhatsApp'}
              </button>
              <button className="auth-btn-ghost" onClick={() => setStep(1)}>Back</button>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ textAlign: 'center' }}>Verify your WhatsApp</h2>
              <p className="auth-hint" style={{ textAlign: 'center' }}>
                We sent a 6-digit code to {details.whatsappNumber}.
              </p>
              <div className="auth-field"><label>Verification code</label>
                <input className="auth-input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" /></div>
              {resendMsg && <p className="auth-hint" style={{ textAlign: 'center' }}>{resendMsg}</p>}
              <button className="auth-btn" disabled={busy} onClick={verifyOtp}>{busy ? 'Verifying…' : 'Verify & finish'}</button>
              <button className="auth-btn-ghost" disabled={busy || resendCooldown > 0} onClick={resendOtp}>
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
              </button>
              <button className="auth-btn-ghost" onClick={() => navigate('/worker/applications')}>Skip for now</button>
            </>
          )}

          <div className="auth-foot">Already registered? <a href="/login">Log in</a></div>
        </div>
      </div>
    </div>
  );
}
