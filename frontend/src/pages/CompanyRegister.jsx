import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import MapPicker from '../components/MapPicker';
import { geocodeAddress } from '../geocode';
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

// 2-step company registration: details + KYC files, then location pin — styled to the mockup.
export default function CompanyRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [districts, setDistricts] = useState([]);
  const [details, setDetails] = useState({ companyName: '', brNumber: '', email: '', password: '', confirmPassword: '', district: '', addressLine: '' });
  const [files, setFiles] = useState({ brCertificate: null, logo: null, premisesPhoto: null });
  const [pin, setPin] = useState({ lat: null, lng: null });
  const [center, setCenter] = useState(null);
  const [err, setErr] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => { api.get('/api/reference/districts').then(setDistricts).catch(() => {}); }, []);

  // Debounced: typing a real address geocodes and drops the pin automatically.
  useEffect(() => {
    const address = details.addressLine.trim();
    if (address.length < 5) return;
    const controller = new AbortController();
    const query = details.district ? `${address}, ${details.district.replaceAll('_', ' ')}, Sri Lanka` : `${address}, Sri Lanka`;
    const timer = setTimeout(async () => {
      setLocating(true);
      try {
        const loc = await geocodeAddress(query, controller.signal);
        if (loc) { setPin(loc); setCenter(loc); }
      } catch (e) {
        if (e.name !== 'AbortError') { /* ignore lookup failures, user can still pin manually */ }
      } finally { setLocating(false); }
    }, 800);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [details.addressLine, details.district]);

  function onDistrict(name) {
    setDetails({ ...details, district: name });
    const d = districts.find((x) => x.name === name);
    if (d) { setCenter({ lat: d.centerLat, lng: d.centerLng }); setPin({ lat: d.centerLat, lng: d.centerLng }); }
  }
  function fe(name) { return fieldErrors[name] && <div className="auth-err">{fieldErrors[name]}</div>; }

  const BR_RE = /^(PV|PQ|PB|GA|GS|FB)\d{4,8}$/;
  const step1Valid = details.companyName && BR_RE.test(details.brNumber) &&
    EMAIL_RE.test(details.email) && PASSWORD_RE.test(details.password) &&
    details.confirmPassword === details.password;

  async function submit() {
    setErr(null); setFieldErrors({}); setBusy(true);
    try {
      if (!pin.lat) { setErr('Please drop a pin on your location'); setBusy(false); return; }
      const { confirmPassword, ...rest } = details;
      const data = { ...rest, latitude: pin.lat, longitude: pin.lng };
      const fd = new FormData();
      fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
      fd.append('brCertificate', files.brCertificate);
      fd.append('logo', files.logo);
      fd.append('premisesPhoto', files.premisesPhoto);
      await api.postForm('/api/auth/register/company', fd);
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) {
        setFieldErrors(e.fieldErrors);
        const step1Fields = ['companyName', 'brNumber', 'email', 'password'];
        if (Object.keys(e.fieldErrors).some((f) => step1Fields.includes(f))) setStep(1);
      }
      setErr(e instanceof ApiError ? e.message : 'Registration failed');
    } finally { setBusy(false); }
  }

  if (done) return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-brand"><span className="auth-mark">FW</span><span className="auth-name">FlexiWork</span></div>
        </div>
        <div className="auth-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44 }}>✅</div>
          <h2 className="mt-8">Registration submitted</h2>
          <p className="auth-hint mt-16">
            Your company is pending verification. An admin will review your BR certificate — or it
            auto-approves within 12 hours. You can log in once verified.
          </p>
          <button className="auth-btn" onClick={() => navigate('/login')}>Go to login</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-bg">
      <div className="auth-card wide">
        <div className="auth-head">
          <div className="auth-brand"><span className="auth-mark">FW</span><span className="auth-name">FlexiWork</span></div>
          <div className="steps">
            {['Company details', 'Location'].map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`step ${step >= i + 1 ? 'done' : ''}`}><span className="step-num">{i + 1}</span>{label}</div>
                {i < 1 && <span className="step-connector" />}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-body">
          {err && <div className="auth-msg-err">{err}</div>}

          {step === 1 && (
            <>
              <div className="auth-grid-2">
                <div className="auth-field"><label>Company name</label>
                  <input className="auth-input" maxLength={120} value={details.companyName} onChange={(e) => setDetails({ ...details, companyName: e.target.value })} />{fe('companyName')}</div>
                <div className="auth-field"><label>BR number</label>
                  <input className="auth-input" placeholder="e.g. PV12345" maxLength={10} value={details.brNumber}
                    onChange={(e) => setDetails({ ...details, brNumber: e.target.value.toUpperCase() })} />
                  <p className="auth-hint">Format: PV/PQ/PB/GA/GS/FB followed by 4-8 digits</p>
                  {details.brNumber && !BR_RE.test(details.brNumber) &&
                    <div className="auth-err">Invalid BR number format</div>}{fe('brNumber')}</div>
              </div>
              <div className="auth-grid-2">
                <div className="auth-field"><label>Email</label>
                  <input className="auth-input" type="email" maxLength={120} placeholder="name@example.com" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                  {details.email && !EMAIL_RE.test(details.email) &&
                    <div className="auth-err">Enter a valid email address</div>}{fe('email')}</div>
                <div className="auth-field"><label>Password</label>
                  <div className="auth-pwd-wrap">
                    <input className="auth-input" type={showPw ? 'text' : 'password'} maxLength={13} value={details.password} onChange={(e) => setDetails({ ...details, password: e.target.value })} />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                  <p className="auth-hint">8-13 characters, mixing letters and numbers, no symbols</p>
                  {details.password && !PASSWORD_RE.test(details.password) &&
                    <div className="auth-err">Password must be 8-13 letters/numbers only, with at least one letter and one number</div>}{fe('password')}</div>
              </div>
              <div className="auth-grid-2">
                <div className="auth-field"><label>Confirm password</label>
                  <div className="auth-pwd-wrap">
                    <input className="auth-input" type={showConfirmPw ? 'text' : 'password'} maxLength={13} value={details.confirmPassword} onChange={(e) => setDetails({ ...details, confirmPassword: e.target.value })} />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPw(v => !v)} aria-label={showConfirmPw ? 'Hide password' : 'Show password'}>
                      <EyeIcon open={showConfirmPw} />
                    </button>
                  </div>
                  {details.confirmPassword && details.confirmPassword !== details.password &&
                    <div className="auth-err">Passwords do not match</div>}{fe('confirmPassword')}</div>
              </div>
              {!step1Valid && (details.companyName || details.brNumber || details.email || details.password) && (
                <p className="auth-hint" style={{ color: 'var(--red)' }}>
                  {!details.companyName && 'Enter a company name. '}
                  {details.companyName && !BR_RE.test(details.brNumber) && 'BR number format is invalid. '}
                  {details.companyName && BR_RE.test(details.brNumber) && !EMAIL_RE.test(details.email) && 'Email is invalid. '}
                  {details.companyName && BR_RE.test(details.brNumber) && EMAIL_RE.test(details.email) && !PASSWORD_RE.test(details.password) && 'Password does not meet the requirements. '}
                  {details.companyName && BR_RE.test(details.brNumber) && EMAIL_RE.test(details.email) && PASSWORD_RE.test(details.password) && details.confirmPassword !== details.password && 'Confirm password does not match.'}
                </p>
              )}
              <div className="auth-field"><label>BR certificate (PDF/JPG/PNG)</label>
                <input className="auth-input" type="file" accept="image/*,application/pdf" onChange={(e) => setFiles({ ...files, brCertificate: e.target.files[0] })} />
                {files.brCertificate && <div className="auth-file-chip">📄 {files.brCertificate.name}</div>}</div>
              <div className="auth-grid-2">
                <div className="auth-field"><label>Company logo</label>
                  <input className="auth-input" type="file" accept="image/*" onChange={(e) => setFiles({ ...files, logo: e.target.files[0] })} />
                  {files.logo && <div className="auth-file-chip">🖼 {files.logo.name}</div>}</div>
                <div className="auth-field"><label>Exterior photo</label>
                  <input className="auth-input" type="file" accept="image/*" onChange={(e) => setFiles({ ...files, premisesPhoto: e.target.files[0] })} />
                  {files.premisesPhoto && <div className="auth-file-chip">🖼 {files.premisesPhoto.name}</div>}</div>
              </div>
              <button className="auth-btn"
                disabled={!files.brCertificate || !files.logo || !files.premisesPhoto || !step1Valid}
                onClick={() => setStep(2)}>Continue to location</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="auth-field"><label>District</label>
                <select className="auth-input" value={details.district} onChange={(e) => onDistrict(e.target.value)}>
                  <option value="">Select…</option>
                  {districts.map((d) => <option key={d.name} value={d.name}>{d.name.replaceAll('_', ' ')}</option>)}
                </select>{fe('district')}</div>
              <div className="auth-field"><label>Address line</label>
                <input className="auth-input" maxLength={160} value={details.addressLine} onChange={(e) => setDetails({ ...details, addressLine: e.target.value })} />
                {locating && <p className="auth-hint">Locating…</p>}{fe('addressLine')}</div>
              <label className="auth-field" style={{ display: 'block' }}>Drop a pin on your exact location</label>
              <div className="map mt-8"><MapPicker value={pin} center={center} onChange={(lat, lng) => setPin({ lat, lng })} /></div>
              {pin.lat && <p className="auth-hint">📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</p>}
              <button className="auth-btn" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit registration'}</button>
              <button className="auth-btn-ghost" onClick={() => setStep(1)}>Back</button>
            </>
          )}

          <div className="auth-foot">Already registered? <a href="/login">Log in</a></div>
        </div>
      </div>
    </div>
  );
}
