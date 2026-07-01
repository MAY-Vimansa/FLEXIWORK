import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import MapPicker from '../components/MapPicker';
import { geocodeAddress } from '../geocode';
import { PASSWORD_RE, EMAIL_RE } from '../validation';
import '../auth.css';

// Sidebar stepper labels (title + sub) shown down the red panel.
const SIDE_STEPS = [
  { title: 'Company details', sub: 'Business & documents' },
  { title: 'Location', sub: 'District & map pin' },
];

// Heading + subtitle for the white panel, per step.
const PANEL_META = {
  1: { title: 'Register your company', sub: 'Step 1 of 2 — your business details.' },
  2: { title: 'Where are you based?', sub: 'Step 2 of 2 — help workers find you.' },
};

function UploadGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15V4" /><path d="M7 9l5-5 5 5" /><path d="M5 20h14" />
    </svg>
  );
}

function ShieldGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// A styled document upload row: hidden native input, upload icon, format hint / filename, "Choose file" button.
function FileRow({ title, hint, accept, file, onPick }) {
  return (
    <label className={`wr-file ${file ? 'has' : ''}`}>
      <span className="wr-file-icon"><UploadGlyph /></span>
      <span className="wr-file-text">
        <span className="wr-file-title">{title}</span>
        <span className="wr-file-name">{file ? file.name : hint}</span>
      </span>
      <span className="wr-file-btn">Choose file</span>
      <input type="file" accept={accept} hidden onChange={(e) => onPick(e.target.files[0])} />
    </label>
  );
}

// 2-step company registration: details + KYC files, then location pin.
// Split-panel design (red sidebar stepper + white form); logic unchanged from the original flow.
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

  const meta = PANEL_META[step];

  return (
    <div className="wr-bg">
      <div className="wr-shell">
        {/* ── Left red sidebar: brand, vertical stepper, verified badge ── */}
        <aside className="wr-side">
          <div className="wr-brand">
            <span className="wr-mark">FW</span>
            <span className="wr-name">FlexiWork</span>
          </div>

          <div className="wr-eyebrow">For employers</div>

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
              <span className="wr-badge-title">Verified employers</span>
              <span className="wr-badge-sub">We check your BR certificate so workers can trust every listing.</span>
            </span>
          </div>
        </aside>

        {/* ── Right white form panel ── */}
        <section className="wr-panel">
          <h1 className="wr-title">{meta.title}</h1>
          <p className="wr-sub">{meta.sub}</p>

          {err && <div className="auth-msg-err">{err}</div>}

          {step === 1 && (
            <>
              <div className="wr-grid">
                <div className="wr-field"><label>Company name</label>
                  <input className="auth-input" maxLength={120} placeholder="Lanka Harvest Logistics" value={details.companyName}
                    onChange={(e) => setDetails({ ...details, companyName: e.target.value })} />{fe('companyName')}</div>

                <div className="wr-field"><label>BR number</label>
                  <input className="auth-input" placeholder="e.g. PV12345" maxLength={10} value={details.brNumber}
                    onChange={(e) => setDetails({ ...details, brNumber: e.target.value.toUpperCase() })} />
                  <p className="auth-hint">Format: PV/PQ/PB/GA/GS/FB + 4–8 digits.</p>
                  {details.brNumber && !BR_RE.test(details.brNumber) &&
                    <div className="auth-err">Invalid BR number format</div>}{fe('brNumber')}</div>

                <div className="wr-field"><label>Email</label>
                  <input className="auth-input" type="email" maxLength={120} placeholder="name@example.com" value={details.email}
                    onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                  {details.email && !EMAIL_RE.test(details.email) &&
                    <div className="auth-err">Enter a valid email address</div>}{fe('email')}</div>

                <div className="wr-field"><label>Password</label>
                  <div className="auth-pwd-wrap">
                    <input className="auth-input" type={showPw ? 'text' : 'password'} maxLength={12} value={details.password}
                      onChange={(e) => setDetails({ ...details, password: e.target.value })} />
                    <button type="button" className="wr-show-btn" onClick={() => setShowPw((v) => !v)}>
                      {showPw ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  <p className="auth-hint">8–12 characters, must start with a capital letter and include a number and a symbol (@, # or $).</p>
                  {details.password && !PASSWORD_RE.test(details.password) &&
                    <div className="auth-err">8–12 characters, must start with a capital letter and include a number and a symbol (@, # or $)</div>}{fe('password')}</div>

                <div className="wr-field"><label>Confirm password</label>
                  <div className="auth-pwd-wrap">
                    <input className="auth-input" type={showConfirmPw ? 'text' : 'password'} maxLength={12} value={details.confirmPassword}
                      onChange={(e) => setDetails({ ...details, confirmPassword: e.target.value })} />
                    <button type="button" className="wr-show-btn" onClick={() => setShowConfirmPw((v) => !v)}>
                      {showConfirmPw ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  {details.confirmPassword && details.confirmPassword !== details.password &&
                    <div className="auth-err">Passwords do not match</div>}{fe('confirmPassword')}</div>
              </div>

              <div className="wr-field"><label>Documents</label></div>
              <FileRow title="BR certificate" hint="PDF, JPG or PNG · required" accept="image/*,application/pdf"
                file={files.brCertificate} onPick={(f) => setFiles({ ...files, brCertificate: f })} />
              <FileRow title="Company logo" hint="PNG or JPG · optional" accept="image/*"
                file={files.logo} onPick={(f) => setFiles({ ...files, logo: f })} />
              <FileRow title="Exterior photo" hint="Photo of your premises · optional" accept="image/*"
                file={files.premisesPhoto} onPick={(f) => setFiles({ ...files, premisesPhoto: f })} />

              <button className="auth-btn"
                disabled={!files.brCertificate || !files.logo || !files.premisesPhoto || !step1Valid}
                onClick={() => setStep(2)}>Continue to location →</button>
              {(!files.brCertificate || !files.logo || !files.premisesPhoto) &&
                <p className="auth-hint" style={{ textAlign: 'center' }}>Attach all three documents to continue.</p>}

              <div className="auth-foot">Already registered? <a href="/login">Log in</a></div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="wr-field"><label>District</label>
                <select className="auth-input" value={details.district} onChange={(e) => onDistrict(e.target.value)}>
                  <option value="">Select…</option>
                  {districts.map((d) => <option key={d.name} value={d.name}>{d.name.replaceAll('_', ' ')}</option>)}
                </select>{fe('district')}</div>

              <div className="wr-field"><label>Address line</label>
                <input className="auth-input" maxLength={160} placeholder="88 Puttalam Road" value={details.addressLine}
                  onChange={(e) => setDetails({ ...details, addressLine: e.target.value })} />
                {locating && <p className="auth-hint">Locating…</p>}{fe('addressLine')}</div>

              <div className="wr-field"><label>Drop a pin on your exact location</label>
                <div className="map mt-8"><MapPicker value={pin} center={center} onChange={(lat, lng) => setPin({ lat, lng })} /></div>
                {pin.lat && <p className="auth-hint">📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</p>}</div>

              <button className="auth-btn" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit registration'}</button>
              <button className="auth-btn-ghost" onClick={() => setStep(1)}>← Back</button>

              <div className="auth-foot">Already registered? <a href="/login">Log in</a></div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
