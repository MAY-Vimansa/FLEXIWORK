import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { ApiError } from '../api';

const HOME_BY_ROLE = {
  WORKER: '/worker/applications',
  COMPANY: '/company',
  COMPANY_POSTER: '/company/jobs',
  COMPANY_GUARD: '/guard',
};

/* badge: { bg, text } — soft pill colours matching the screenshot */
const BADGE = {
  Factory:    { bg: '#FFE8E8', text: '#E53935' },
  Restaurant: { bg: '#FFF3E0', text: '#E65100' },
  Retail:     { bg: '#E8F5E9', text: '#2E7D32' },
};

const SAMPLE_CARDS = [
  { label: 'Factory',    companyColor: '#E53935', wage: 'LKR 3,000', title: 'Factory Worker',   company: 'ABC Garments Ltd',    time: '08:00 – 17:00', location: 'Ekala',     rotate: '-7deg', zIndex: 1, top: 0,   left: 0,   animDelay: '0s',   floatDelay: '0s' },
  { label: 'Restaurant', companyColor: '#E53935', wage: 'LKR 1,600', title: 'Barista',          company: 'Bean & Co Cafe',      time: '07:00 – 15:00', location: 'Colombo 5', rotate: '4deg',  zIndex: 3, top: 40,  left: 90,  animDelay: '0.15s',floatDelay: '1.3s' },
  { label: 'Retail',     companyColor: '#E53935', wage: null,         title: 'Warehouse Packer', company: 'SwiftMart Logistics', time: '07:00 – 16:00', location: 'Kelaniya',  rotate: '-2deg', zIndex: 2, top: 130, left: 10,  animDelay: '0.3s', floatDelay: '0.7s' },
];

const LOGIN_CARD_STYLES = `
  @keyframes lc-float {
    0%, 100% { transform: rotate(var(--r)) translateY(0px); }
    50%       { transform: rotate(var(--r)) translateY(-9px); }
  }
  @keyframes lc-enter {
    from { opacity: 0; transform: rotate(var(--r)) translateY(20px) scale(.96); }
    to   { opacity: 1; transform: rotate(var(--r)) translateY(0)    scale(1); }
  }
  .lc-card {
    animation:
      lc-enter .6s cubic-bezier(.22,.68,0,1.15) var(--enter-d, 0s) both,
      lc-float  4s ease-in-out              var(--float-d, 0s)  infinite;
  }
`;

function SampleCard({ label, companyColor, wage, title, company, time, location, rotate, zIndex, top, left, animDelay, floatDelay }) {
  const badge = BADGE[label] || { bg: '#F0F0F0', text: '#555' };
  return (
    <div
      className="lc-card lc-sample-card"
      style={{
        position: 'absolute', top, left,
        '--r': rotate, '--enter-d': animDelay, '--float-d': floatDelay,
        zIndex,
        background: '#fff',
        borderRadius: 18,
        padding: '16px 20px',
        width: 230,
        boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase',
          color: badge.text, background: badge.bg,
          borderRadius: 999, padding: '4px 10px',
        }}>{label}</span>
        {wage && <span style={{ fontWeight: 900, fontSize: 14, color: '#1A1A1A' }}>{wage}</span>}
      </div>
      <div style={{ fontWeight: 900, fontSize: 17, color: '#1A1A1A', marginBottom: 4, letterSpacing: '-.3px' }}>{title}</div>
      <div style={{ fontSize: 13, color: companyColor, fontWeight: 700, marginBottom: 8 }}>{company}</div>
      <div style={{ fontSize: 12, color: '#9A9A9A', display: 'flex', alignItems: 'center', gap: 5 }}>
        {time}
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#C8C8C8', display: 'inline-block' }} />
        {location}
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const identifier = form.identifier.trim();
    if (!identifier || !form.password) { setErr('Enter your email/phone and password.'); return; }
    setErr(null); setBusy(true);
    try {
      const res = await login(identifier, form.password, remember);
      const dest = location.state?.from || HOME_BY_ROLE[res.role] || '/';
      navigate(dest, { replace: true });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Login failed. Check your details.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <style>{LOGIN_CARD_STYLES}</style>
    <div style={{ display: 'flex', flex: 1, fontFamily: 'inherit' }}>

      {/* ── Left panel ── */}
      <div style={{
        width: '46%', flexShrink: 0,
        background: 'linear-gradient(160deg, #E8150A 0%, #C51009 55%, #A80D08 100%)',
        display: 'flex', flexDirection: 'column',
        padding: '32px 40px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{
            width: 40, height: 40, borderRadius: 11,
            background: '#fff', color: '#EB1700',
            display: 'grid', placeItems: 'center',
            fontWeight: 900, fontSize: 14,
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          }}>FW</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-.4px' }}>FlexiWork</span>
        </Link>

        {/* Headline */}
        <div style={{ marginTop: 'auto', paddingBottom: 280 }}>
          <h1 style={{
            color: '#fff', fontWeight: 900,
            fontSize: 'clamp(28px, 3.2vw, 44px)',
            lineHeight: 1.1, letterSpacing: '-1px',
            margin: '0 0 16px',
          }}>
            Find daily work.<br />
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Get paid today.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 1.6, maxWidth: 320, margin: 0 }}>
            Log in to apply for flexible shifts, track your applications, and get hired by Sri Lanka's leading employers.
          </p>
        </div>

        {/* Stacked sample job cards */}
        <div style={{ position: 'absolute', bottom: 40, left: 40, height: 220, width: 320 }}>
          {SAMPLE_CARDS.map((c, i) => <SampleCard key={i} {...c} />)}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="login-right-panel" style={{
        flex: 1, background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px',
      }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 400 }}>
          <h2 className="login-title" style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px', letterSpacing: '-.5px' }}>
            Log in to FlexiWork
          </h2>
          <p className="login-sub" style={{ fontSize: 14, color: '#6B6B6B', margin: '0 0 32px' }}>
            Welcome back. Enter your details to continue.
          </p>

          {err && (
            <div className="login-error" style={{
              background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
              borderRadius: 10, padding: '10px 14px', fontSize: 13.5, marginBottom: 20,
            }}>{err}</div>
          )}

          {/* Identifier */}
          <div style={{ marginBottom: 14 }}>
            <div className="login-input-wrap" style={{
              display: 'flex', alignItems: 'center',
              border: '1.5px solid #E2E2E2', borderRadius: 12,
              background: '#fff', transition: 'border-color .15s',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = '#EB1700'}
              onBlurCapture={e => e.currentTarget.style.borderColor = '#E2E2E2'}
            >
              <span style={{ padding: '0 14px', color: '#9A9A9A', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                className="login-input"
                type="text"
                placeholder="Email or phone number"
                required
                value={form.identifier}
                onChange={e => setForm({ ...form, identifier: e.target.value })}
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  padding: '14px 14px 14px 0', fontSize: 15, color: '#1A1A1A',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 18 }}>
            <div className="login-input-wrap" style={{
              display: 'flex', alignItems: 'center',
              border: '1.5px solid #E2E2E2', borderRadius: 12,
              background: '#fff', transition: 'border-color .15s',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = '#EB1700'}
              onBlurCapture={e => e.currentTarget.style.borderColor = '#E2E2E2'}
            >
              <span style={{ padding: '0 14px', color: '#9A9A9A', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                className="login-input"
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  padding: '14px 0', fontSize: 15, color: '#1A1A1A',
                  fontFamily: 'inherit',
                }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{
                padding: '0 14px', background: 'none', border: 'none', cursor: 'pointer',
                color: '#9A9A9A', display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                {showPw ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <label className="login-remember" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#3D3D3D', cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#EB1700' }} />
              Remember me
            </label>
            <Link to="/forgot-password" style={{ fontSize: 14, fontWeight: 700, color: '#EB1700', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          {/* Log in button */}
          <button type="submit" disabled={busy} style={{
            width: '100%', padding: '15px', borderRadius: 12, border: 'none',
            background: busy ? '#F87171' : '#EB1700', color: '#fff',
            fontWeight: 800, fontSize: 16, cursor: busy ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 22px rgba(235,23,0,.30)',
            transition: 'background .15s, transform .1s',
            fontFamily: 'inherit',
          }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#C51009'; }}
            onMouseLeave={e => { if (!busy) e.currentTarget.style.background = '#EB1700'; }}
          >
            {busy ? 'Logging in…' : 'Log in'}
          </button>

          {/* Create account */}
          <p className="login-footer-text" style={{ textAlign: 'center', fontSize: 14, color: '#9A9A9A', margin: '20px 0 12px' }}>
            New to FlexiWork?
          </p>
          <Link to="/register" className="login-register-link" style={{
            display: 'block', width: '100%', padding: '14px', borderRadius: 12,
            border: '1.5px solid #EB1700', background: '#fff', color: '#EB1700',
            fontWeight: 800, fontSize: 15, textAlign: 'center', textDecoration: 'none',
            transition: 'background .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF0EE'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            Create an account
          </Link>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#B0B0B0', marginTop: 24 }}>
            By continuing you agree to our{' '}
            <Link to="/terms" style={{ color: '#6B6B6B', fontWeight: 600 }}>Terms</Link>
            {' & '}
            <Link to="/privacy" style={{ color: '#6B6B6B', fontWeight: 600 }}>Privacy Policy</Link>.
          </p>
        </form>
      </div>
    </div>
    </>
  );
}
