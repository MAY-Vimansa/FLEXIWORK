import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const BADGE_COLORS = {
  FACTORY:    { bg: '#3B3B3B', color: '#fff' },
  MARKETING:  { bg: '#7C3AED', color: '#fff' },
  RESTAURANT: { bg: '#DC2626', color: '#fff' },
  RETAIL:     { bg: '#0369A1', color: '#fff' },
};

const FLOAT_CARDS = [
  { pos: { top: 48, left: 32 },     animDelay: '0s',    category: 'FACTORY',    label: 'Factory',    wage: 'LKR 2,200', title: 'Garment Factory Worker', time: '08:00–17:00', location: 'Katunayake' },
  { pos: { top: 48, right: 32 },    animDelay: '1.4s',  category: 'MARKETING',  label: 'Marketing',  wage: 'LKR 2,500', title: 'Brand Promoter',         time: '09:00–17:00', location: 'Colombo' },
  { pos: { bottom: 90, left: 32 },  animDelay: '0.7s',  category: 'RESTAURANT', label: 'Restaurant', wage: 'LKR 1,200', title: 'Restaurant Waiter',       time: '11:00–23:00', location: 'Kandy City' },
  { pos: { bottom: 90, right: 32 }, animDelay: '2.1s',  category: 'RETAIL',     label: 'Retail',     wage: 'LKR 1,800', title: 'Warehouse Packer',        time: '07:00–16:00', location: 'Kelaniya' },
];

function FloatCard({ pos, animDelay, category, label, wage, title, time, location }) {
  const { bg, color } = BADGE_COLORS[category];
  return (
    <div style={{
      position: 'absolute', ...pos,
      background: 'rgba(255,255,255,0.13)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.22)',
      borderRadius: 14,
      padding: '12px 16px',
      minWidth: 190,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      pointerEvents: 'none',
      animation: `rc-float 4s ease-in-out infinite`,
      animationDelay: animDelay,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{
          background: bg, color, fontSize: 9, fontWeight: 700,
          letterSpacing: 1, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase',
        }}>{label}</span>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{wage}</span>
      </div>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</div>
      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{time} · {location}</div>
    </div>
  );
}

function ChoicePanel({ onClick, children, accentColor }) {
  const [hovered, setHovered] = useState(false);
  const borderColor = accentColor === 'red' ? '#EB1700' : '#1A1A1A';
  return (
    <div
      className="rc-panel"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1, padding: '36px 36px 32px', cursor: 'pointer',
        background: hovered ? (accentColor === 'red' ? '#FFF8F7' : '#F9FAFB') : '#fff',
        borderRadius: 20,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: hovered
          ? '0 32px 80px rgba(0,0,0,0.28)'
          : '0 16px 48px rgba(0,0,0,0.18)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'background .2s, transform .2s, box-shadow .2s',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
}

export default function RoleChoice() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @keyframes rc-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .rc-card-btn-red   { transition: background .15s, transform .1s, box-shadow .15s !important; }
        .rc-card-btn-red:hover   { background: #C51009 !important; transform: translateY(-1px); box-shadow: 0 10px 28px rgba(235,23,0,.38) !important; }
        .rc-card-btn-red:active  { transform: translateY(0); }
        .rc-card-btn-dark  { transition: background .15s, transform .1s, box-shadow .15s !important; }
        .rc-card-btn-dark:hover  { background: #333 !important; transform: translateY(-1px); box-shadow: 0 10px 28px rgba(26,26,26,.3) !important; }
        .rc-card-btn-dark:active { transform: translateY(0); }
        .rc-login-link { transition: opacity .15s; }
        .rc-login-link:hover { opacity: 0.8; }
      `}</style>

      <div style={{
        background: 'linear-gradient(160deg, #E8150A 0%, #C51009 60%, #A80D08 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Floating job cards */}
        {FLOAT_CARDS.map((c, i) => <FloatCard key={i} {...c} />)}

        {/* Hero */}
        <div style={{
          position: 'relative', zIndex: 10,
          flex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '80px 24px 80px',
          textAlign: 'center',
        }}>

          {/* Eyebrow badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 999, padding: '6px 16px',
            color: '#fff', fontSize: 13, fontWeight: 600,
            marginBottom: 28,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
            Sri Lanka's Daily Job Platform
          </div>

          <h1 style={{
            color: '#fff', fontWeight: 900,
            fontSize: 'clamp(36px, 5vw, 62px)',
            lineHeight: 1.1, letterSpacing: '-1.5px',
            margin: '0 0 18px',
            maxWidth: 680,
          }}>
            How would you like<br />to use{' '}
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>FlexiWork?</span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.78)', fontSize: 16,
            maxWidth: 460, margin: '0 0 44px', lineHeight: 1.6,
          }}>
            Join thousands of workers and companies already using<br />
            FlexiWork to fill daily shifts across Sri Lanka.
          </p>

          {/* Cards */}
          <div style={{
            display: 'flex', gap: 16, alignItems: 'stretch',
            maxWidth: 760, width: '100%',
            position: 'relative',
          }}>

            {/* Worker card */}
            <ChoicePanel onClick={() => navigate('/register/worker')} accentColor="red">
              <div style={{ position: 'relative', width: 52, height: 52, marginBottom: 20 }}>
                <div className="rc-icon-box rc-icon-box-red" style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: '#FFF0EE', display: 'grid', placeItems: 'center',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#EB1700', display: 'grid', placeItems: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px', letterSpacing: '-.4px' }}>
                I'm looking<br />for work
              </h2>
              <p style={{ fontSize: 13.5, color: '#6B6B6B', margin: '0 0 14px', lineHeight: 1.5 }}>
                Browse daily job listings, apply in seconds, and start earning. Get paid same-day for every shift.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
                {['500+ Active Jobs', 'Daily Pay', 'Instant Apply'].map(b => (
                  <span key={b} className="rc-badge rc-badge-red" style={{
                    fontSize: 11.5, fontWeight: 600, color: '#EB1700',
                    background: '#FFF0EE', borderRadius: 999, padding: '4px 10px',
                  }}>{b}</span>
                ))}
              </div>

              <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['🔍', 'Browse jobs near you'], ['📅', 'Choose your own schedule'], ['💵', 'Get paid every day']].map(([icon, text]) => (
                  <li key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#3D3D3D' }}>
                    <span style={{ fontSize: 15 }}>{icon}</span> {text}
                  </li>
                ))}
              </ul>

              <button type="button" className="rc-card-btn-red" onClick={(e) => { e.stopPropagation(); navigate('/register/worker'); }} style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                background: '#EB1700', color: '#fff',
                fontWeight: 800, fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 8px 22px rgba(235,23,0,.28)',
              }}>
                Register as Employee <span style={{ fontSize: 17 }}>→</span>
              </button>
            </ChoicePanel>

            {/* OR bubble */}
            <div className="rc-or-bubble" style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              width: 36, height: 36, borderRadius: '50%',
              background: '#fff',
              border: '1.5px solid #DDDDE3',
              display: 'grid', placeItems: 'center',
              fontSize: 11, fontWeight: 700, color: '#9A9A9A',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}>OR</div>

            {/* Company card */}
            <ChoicePanel onClick={() => navigate('/register/company')} accentColor="dark">
              <div style={{ position: 'relative', width: 52, height: 52, marginBottom: 20 }}>
                <div className="rc-icon-box rc-icon-box-dark" style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: '#F3F4F6', display: 'grid', placeItems: 'center',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#1A1A1A', display: 'grid', placeItems: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px', letterSpacing: '-.4px' }}>
                I'm hiring<br />workers
              </h2>
              <p style={{ fontSize: 13.5, color: '#6B6B6B', margin: '0 0 14px', lineHeight: 1.5 }}>
                Post shift openings, find verified workers instantly, and manage your workforce all in one place.
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
                {['10K+ Workers', 'Post in Minutes', 'RoC Verified'].map(b => (
                  <span key={b} className="rc-badge rc-badge-dark" style={{
                    fontSize: 11.5, fontWeight: 600, color: '#374151',
                    background: '#F3F4F6', borderRadius: 999, padding: '4px 10px',
                  }}>{b}</span>
                ))}
              </div>

              <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['👥', 'Access 10,000+ verified workers'], ['🛡', 'Background-checked staff'], ['📋', 'Manage shifts & rosters easily']].map(([icon, text]) => (
                  <li key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#3D3D3D' }}>
                    <span style={{ fontSize: 15 }}>{icon}</span> {text}
                  </li>
                ))}
              </ul>

              <button type="button" className="rc-card-btn-dark" onClick={(e) => { e.stopPropagation(); navigate('/register/company'); }} style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                background: '#1A1A1A', color: '#fff',
                fontWeight: 800, fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 8px 22px rgba(26,26,26,.22)',
              }}>
                Register as Company <span style={{ fontSize: 17 }}>→</span>
              </button>
            </ChoicePanel>
          </div>

          {/* Footer link */}
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 28 }}>
            Already have an account?{' '}
            <Link to="/login" className="rc-login-link" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
