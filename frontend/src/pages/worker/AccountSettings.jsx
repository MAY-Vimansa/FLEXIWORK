import { useState } from 'react';
import { api, ApiError } from '../../api';
import { useAuth } from '../../auth';
import { PASSWORD_RE, EMAIL_RE } from '../../validation';

const OTP_RE = /^\d{6}$/;

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Account settings for a worker: change email (password-confirmed), WhatsApp number (OTP), and
// password (email OTP). Each block manages its own small state + status message.
export default function AccountSettings() {
  const { user } = useAuth();
  const email = user?.email || '';
  return (
    <div className="card mt-16">
      <h3>Account settings</h3>
      <ChangeEmail currentEmail={email} />
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '18px 0' }} />
      <ChangePassword email={email} />
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '18px 0' }} />
      <ChangeWhatsapp />
    </div>
  );
}

function Status({ msg, err }) {
  if (err) return <div className="form-error">{err}</div>;
  if (msg) return <div className="form-ok">{msg}</div>;
  return null;
}

function ChangeEmail({ currentEmail }) {
  const [step, setStep] = useState(1);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const emailValid = !newEmail || EMAIL_RE.test(newEmail);

  async function requestChange(e) {
    e.preventDefault(); setMsg(null); setErr(null);
    try {
      const res = await api.post('/api/worker/account/email/request', { currentPassword: password, newEmail });
      setMsg(res.message); setStep(2);
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed'); }
  }

  async function confirmChange(e) {
    e.preventDefault(); setMsg(null); setErr(null);
    try {
      const res = await api.post('/api/worker/account/email/confirm', { otp });
      setMsg(res.message); setStep(1); setNewEmail(''); setPassword(''); setOtp('');
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed'); }
  }

  return (
    <div>
      <h4 className="muted">Change email</h4>
      <Status msg={msg} err={err} />
      {step === 1 ? (
        <form onSubmit={requestChange}>
          <div className="field mt-8"><label>New email (current: {currentEmail})</label>
            <input className="input" type="email" required maxLength={120} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            {!emailValid && <div className="field-error">Enter a valid email address</div>}</div>
          <div className="field">
            <label>Current password</label>
            <div className="pwd-wrap">
              <input className="input" type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" disabled={!emailValid || !newEmail || !password}>Send confirmation code</button>
        </form>
      ) : (
        <form onSubmit={confirmChange}>
          <p className="muted" style={{ fontSize: 13 }}>We sent a code to {newEmail}. Enter it to confirm.</p>
          <div className="field mt-8"><label>Confirmation code</label>
            <input className="input" required maxLength={6} inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
            {otp && !OTP_RE.test(otp) && <div className="field-error">Enter the 6-digit code</div>}</div>
          <button className="btn btn-primary btn-sm" disabled={!OTP_RE.test(otp)}>Confirm new email</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setStep(1)}>Cancel</button>
        </form>
      )}
    </div>
  );
}

function ChangePassword({ email }) {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function requestCode() {
    setMsg(null); setErr(null);
    try {
      await api.post('/api/auth/password/forgot', { email });
      setMsg('Code sent to your email.'); setStep(2);
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed'); }
  }
  async function reset(e) {
    e.preventDefault(); setMsg(null); setErr(null);
    try {
      await api.post('/api/auth/password/reset', { email, otp, newPassword });
      setMsg('Password changed.'); setStep(1); setOtp(''); setNewPassword('');
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed'); }
  }

  return (
    <div>
      <h4 className="muted">Change password</h4>
      <Status msg={msg} err={err} />
      {step === 1 ? (
        <button className="btn btn-secondary btn-sm mt-8" onClick={requestCode}>Email me a reset code</button>
      ) : (
        <form onSubmit={reset}>
          <div className="field mt-8"><label>Code from email</label>
            <input className="input" required maxLength={6} inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
            {otp && !OTP_RE.test(otp) && <div className="field-error">Enter the 6-digit code</div>}</div>
          <div className="field">
            <label>New password</label>
            <div className="pwd-wrap">
              <input className="input" type={showPw ? 'text' : 'password'} maxLength={12} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                <EyeIcon open={showPw} />
              </button>
            </div>
            {newPassword && !PASSWORD_RE.test(newPassword) &&
              <div className="field-error">8–12 characters, must start with a capital letter and include a number and a symbol (@, # or $)</div>}
            <p className="auth-hint">8–12 characters, must start with a capital letter and include a number and a symbol (@, # or $)</p>
          </div>
          <button className="btn btn-primary btn-sm" disabled={!PASSWORD_RE.test(newPassword) || !OTP_RE.test(otp)}>Set new password</button>
        </form>
      )}
    </div>
  );
}

function ChangeWhatsapp() {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function sendOtp() {
    setMsg(null); setErr(null);
    try {
      await api.post('/api/worker/whatsapp/send-otp');
      setMsg('Code sent via WhatsApp.'); setStep(2);
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed'); }
  }
  async function verify(e) {
    e.preventDefault(); setMsg(null); setErr(null);
    try {
      await api.post('/api/worker/whatsapp/verify', { otp });
      setMsg('WhatsApp verified.'); setStep(1); setOtp('');
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed'); }
  }

  return (
    <div>
      <h4 className="muted">Verify WhatsApp number</h4>
      <Status msg={msg} err={err} />
      {step === 1 ? (
        <button className="btn btn-secondary btn-sm mt-8" onClick={sendOtp}>Send WhatsApp code</button>
      ) : (
        <form onSubmit={verify}>
          <div className="field mt-8"><label>Code from WhatsApp</label>
            <input className="input" required maxLength={6} inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
            {otp && !OTP_RE.test(otp) && <div className="field-error">Enter the 6-digit code</div>}</div>
          <button className="btn btn-primary btn-sm" disabled={!OTP_RE.test(otp)}>Verify</button>
        </form>
      )}
    </div>
  );
}
