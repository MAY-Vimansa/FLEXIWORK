import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { PASSWORD_RE } from '../validation';
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

const OTP_RE = /^\d{6}$/;

// Email-OTP password reset: request a code, then submit code + new password.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function requestCode(e) {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      const res = await api.post('/api/auth/password/forgot', { email });
      setMsg(res.message); setStep(2);
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed'); } finally { setBusy(false); }
  }

  async function reset(e) {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      await api.post('/api/auth/password/reset', { email, otp, newPassword });
      navigate('/login');
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed'); } finally { setBusy(false); }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-brand"><span className="auth-mark">FW</span><span className="auth-name">FlexiWork</span></div>
          <h1>Reset password</h1>
          <p>{step === 1 ? 'We\'ll email you a reset code.' : 'Enter the code from your email.'}</p>
        </div>
        <div className="auth-body">
          {err && <div className="auth-msg-err">{err}</div>}
          {msg && <div className="auth-msg-ok">{msg}</div>}

          {step === 1 ? (
            <form onSubmit={requestCode}>
              <div className="auth-field"><label>Email</label>
                <input className="auth-input" type="email" required maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <button className="auth-btn" disabled={busy || !email.trim()}>Send reset code</button>
            </form>
          ) : (
            <form onSubmit={reset}>
              <div className="auth-field"><label>Code from email</label>
                <input className="auth-input" required maxLength={6} inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
                {otp && !OTP_RE.test(otp) && <div className="auth-err">Enter the 6-digit code from your email</div>}</div>
              <div className="auth-field"><label>New password</label>
                <div className="auth-pwd-wrap">
                  <input className="auth-input" type={showPw ? 'text' : 'password'} maxLength={13} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
                {newPassword && !PASSWORD_RE.test(newPassword) &&
                  <div className="auth-err">Password must be 8-13 letters/numbers only, with at least one letter and one number</div>}
                <p className="auth-hint">8-13 characters, mixing letters and numbers</p></div>
              <button className="auth-btn" disabled={busy || !PASSWORD_RE.test(newPassword) || !OTP_RE.test(otp)}>Reset password</button>
            </form>
          )}
          <div className="auth-foot"><Link to="/login">Back to login</Link></div>
        </div>
      </div>
    </div>
  );
}
