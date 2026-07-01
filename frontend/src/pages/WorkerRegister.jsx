import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import { PASSWORD_RE, EMAIL_RE } from '../validation';
import '../auth.css';

// 3-step worker registration: details -> KYC files -> WhatsApp OTP, styled to the red/white mockup.
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

  const stepMeta = [
    { title: 'Details', sub: 'Your information' },
    { title: 'Documents', sub: 'NIC & proof' },
    { title: 'Verify', sub: 'Final review' },
  ];
  const headings = [
    { title: 'Create your worker profile', sub: 'Step 1 of 3 — tell us who you are.' },
    { title: 'Upload your documents', sub: 'Step 2 of 3 — NIC & proof of identity.' },
    { title: 'Verify your WhatsApp', sub: 'Step 3 of 3 — final review.' },
  ];

  return (
    <div className="wr-bg">
      <div className="wr-card">
        {/* Left red sidebar: brand, vertical stepper, data-safety card */}
        <aside className="wr-side">
          <div className="auth-brand"><span className="auth-mark">FW</span>
            <span className="auth-name">FlexiWork</span></div>
          <div className="wr-steps">
            {stepMeta.map((s, i) => (
              <div key={s.title}>
                <div className={`wr-vstep ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
                  <span className="wr-vstep-num">{i + 1}</span>
                  <div>
                    <div className="wr-vstep-title">{s.title}</div>
                    <div className="wr-vstep-sub">{s.sub}</div>
                  </div>
                </div>
                {i < 2 && <div className="wr-vconnector" />}
              </div>
            ))}
          </div>
          <div className="wr-safe">
            <div className="wr-safe-title">🛡 Your data is safe</div>
            <div className="wr-safe-text">We only share your profile with verified employers you apply to.</div>
          </div>
        </aside>

        {/* Right form panel */}
        <main className="wr-main">
          <div className="wr-main-head">
            <div>
              <div className="wr-title">{headings[step - 1].title}</div>
              <div className="wr-sub">{headings[step - 1].sub}</div>
            </div>
            {step !== 3 && (
              <div className="wr-photo-wrap">
                <label className="wr-photo">
                  {photoPreview
                    ? <img src={photoPreview} alt="" />
                    : (
                      <svg className="wr-photo-icon" width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.7-8 6v1h16v-1c0-3.3-3.6-6-8-6Z" />
                      </svg>
                    )}
                  <span className="wr-photo-badge">+</span>
                  <input type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files[0])} />
                </label>
                <div className="wr-photo-label">Profile photo</div>
              </div>
            )}
          </div>

          <div className="wr-form">
            {err && <div className="auth-msg-err">{err}</div>}

            {step === 1 && (
              <>
                <div className="wr-field"><label>Full name</label>
                  <input className="wr-input" placeholder="e.g. Nimal Perera" maxLength={80} value={details.fullName} onChange={(e) => setDetails({ ...details, fullName: e.target.value })} />{fe('fullName')}</div>

                <div className="wr-grid-2">
                  <div className="wr-field"><label>NIC number</label>
                    <input className="wr-input" placeholder="991234567V" maxLength={12} value={details.nicNumber}
                      onChange={(e) => setDetails({ ...details, nicNumber: e.target.value.toUpperCase() })} />
                    {details.nicNumber && !NIC_RE.test(details.nicNumber) &&
                      <div className="auth-err">Enter a valid NIC: 9 digits + letter, or 12 digits</div>}{fe('nicNumber')}</div>
                  <div className="wr-field"><label>Date of birth</label>
                    <input className="wr-input" type="date" value={details.dateOfBirth}
                      onChange={(e) => setDetails({ ...details, dateOfBirth: e.target.value })} /></div>
                </div>

                <div className="wr-grid-2">
                  <div className="wr-field"><label>WhatsApp</label>
                    <input className="wr-input" placeholder="0712345678" maxLength={10} value={details.whatsappNumber}
                      onChange={(e) => setDetails({ ...details, whatsappNumber: e.target.value.replace(/\D/g, '') })} />
                    {details.whatsappNumber && !PHONE_RE.test(details.whatsappNumber) &&
                      <div className="auth-err">Enter a valid number starting with 07, 10 digits</div>}{fe('whatsappNumber')}</div>
                  <div className="wr-field"><label>Email</label>
                    <input className="wr-input" type="email" maxLength={120} placeholder="name@example.com" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                    {details.email && !EMAIL_RE.test(details.email) &&
                      <div className="auth-err">Enter a valid email address</div>}{fe('email')}</div>
                </div>

                <div className="wr-grid-2">
                  <div className="wr-field"><label>District</label>
                    <select className="wr-input" value={details.district} onChange={(e) => setDetails({ ...details, district: e.target.value })}>
                      <option value="">Select…</option>
                      {districts.map((d) => <option key={d.name} value={d.name}>{d.name.replaceAll('_', ' ')}</option>)}
                    </select>{fe('district')}</div>
                  <div className="wr-field"><label>Skills <span className="wr-opt">· optional</span></label>
                    <input className="wr-input" placeholder="Driving, packing…" maxLength={200} value={details.skills} onChange={(e) => setDetails({ ...details, skills: e.target.value })} /></div>
                </div>

                <div className="wr-grid-2">
                  <div className="wr-field"><label>Password</label>
                    <div className="wr-pwd">
                      <input className="wr-input" type={showPw ? 'text' : 'password'} maxLength={13} value={details.password} onChange={(e) => setDetails({ ...details, password: e.target.value })} />
                      <button type="button" className="wr-pwd-show" onClick={() => setShowPw(v => !v)}>{showPw ? 'HIDE' : 'SHOW'}</button>
                    </div>
                    {details.password && !PASSWORD_RE.test(details.password) &&
                      <div className="auth-err">Password must be 8-13 letters/numbers, with at least one letter and one number</div>}
                    <p className="auth-hint">8–13 characters, mixing letters and numbers.</p>{fe('password')}</div>
                  <div className="wr-field"><label>Confirm password</label>
                    <div className="wr-pwd">
                      <input className="wr-input" type={showConfirmPw ? 'text' : 'password'} maxLength={13} value={details.confirmPassword} onChange={(e) => setDetails({ ...details, confirmPassword: e.target.value })} />
                      <button type="button" className="wr-pwd-show" onClick={() => setShowConfirmPw(v => !v)}>{showConfirmPw ? 'HIDE' : 'SHOW'}</button>
                    </div>
                    {details.confirmPassword && details.confirmPassword !== details.password &&
                      <div className="auth-err">Passwords do not match</div>}{fe('confirmPassword')}</div>
                </div>

                <button className="wr-continue" onClick={() => setStep(2)}
                  disabled={!step1Valid || !files.profilePhoto}>
                  Continue to documents →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <p className="auth-hint">Upload clear photos of your NIC. JPG/PNG, max 5MB each.</p>
                <div className="wr-field"><label>NIC — front</label>
                  <input className="wr-input" type="file" accept="image/*" onChange={(e) => setFiles({ ...files, nicFront: e.target.files[0] })} />
                  {files.nicFront && <div className="auth-file-chip">📄 {files.nicFront.name}</div>}</div>
                <div className="wr-field"><label>NIC — back</label>
                  <input className="wr-input" type="file" accept="image/*" onChange={(e) => setFiles({ ...files, nicBack: e.target.files[0] })} />
                  {files.nicBack && <div className="auth-file-chip">📄 {files.nicBack.name}</div>}</div>
                <button className="wr-continue" disabled={busy || !files.nicFront || !files.nicBack} onClick={submitRegistration}>
                  {busy ? 'Submitting…' : 'Submit & verify WhatsApp'}
                </button>
                <button className="wr-ghost" onClick={() => setStep(1)}>Back</button>
              </>
            )}

            {step === 3 && (
              <>
                <p className="auth-hint">We sent a 6-digit code to {details.whatsappNumber}.</p>
                <div className="wr-field"><label>Verification code</label>
                  <input className="wr-input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" /></div>
                {resendMsg && <p className="auth-hint">{resendMsg}</p>}
                <button className="wr-continue" disabled={busy} onClick={verifyOtp}>{busy ? 'Verifying…' : 'Verify & finish'}</button>
                <button className="wr-ghost" disabled={busy || resendCooldown > 0} onClick={resendOtp}>
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                </button>
                <button className="wr-ghost" onClick={() => navigate('/worker/applications')}>Skip for now</button>
              </>
            )}

            <div className="wr-foot">Already registered? <a href="/login">Log in</a></div>
          </div>
        </main>
      </div>
    </div>
  );
}
