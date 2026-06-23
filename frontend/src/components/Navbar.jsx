import { useState, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import ConfirmDialog from './ConfirmDialog';

function useDarkMode() {
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const toggle = useCallback(() => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try { localStorage.setItem('fw-theme', next ? 'dark' : 'light'); } catch (e) {}
  }, [dark]);
  return [dark, toggle];
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, toggleTheme] = useDarkMode();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const navLinkStyle = ({ isActive }) => ({
    padding: '8px 16px',
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 15,
    color: isActive ? '#EB1700' : (dark ? '#F3F4F6' : '#1A1A1A'),
    background: isActive ? (dark ? '#2C1210' : '#FFF1EF') : 'transparent',
    textDecoration: 'none',
    transition: 'background .15s, color .15s',
    whiteSpace: 'nowrap',
  });

  function confirmLogout() {
    setConfirmingLogout(false);
    logout();
    navigate('/login');
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: dark ? 'rgba(17,24,39,.95)' : 'rgba(255,255,255,.95)',
      backdropFilter: 'saturate(160%) blur(12px)',
      borderBottom: `1px solid ${dark ? '#374151' : '#ECECEC'}`,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '12px 32px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>

        {/* LOGO */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{
            width: 38, height: 38, borderRadius: 11, background: '#EB1700', color: '#fff',
            display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14,
            boxShadow: '0 4px 14px rgba(235,23,0,.32)', flexShrink: 0,
          }}>FW</span>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.5px', color: dark ? '#F3F4F6' : '#1A1A1A' }}>
            Flexi<span style={{ color: '#EB1700' }}>Work</span>
          </span>
        </Link>

        {/* CENTER NAV */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, margin: '0 auto' }}>
          <NavLink to="/" end style={navLinkStyle}>Home</NavLink>
          <NavLink to="/about" style={navLinkStyle}>About Us</NavLink>
          <NavLink to="/how-it-works" style={navLinkStyle}>Services</NavLink>
          <NavLink to="/contact" style={navLinkStyle}>Contact Us</NavLink>

          {user?.role === 'WORKER' && (
            <NavLink to="/worker/applications" style={navLinkStyle}>My Dashboard</NavLink>
          )}
          {user?.role === 'COMPANY' && <>
            <NavLink to="/company" style={navLinkStyle}>Dashboard</NavLink>
            <NavLink to="/company/jobs" style={navLinkStyle}>My Jobs</NavLink>
            <NavLink to="/company/post" style={navLinkStyle}>Post Job</NavLink>
            <NavLink to="/company/payments" style={navLinkStyle}>Payments</NavLink>
            <NavLink to="/company/staff" style={navLinkStyle}>Staff</NavLink>
          </>}
          {user?.role === 'COMPANY_POSTER' && <>
            <NavLink to="/company/jobs" style={navLinkStyle}>My Jobs</NavLink>
            <NavLink to="/company/post" style={navLinkStyle}>Post Job</NavLink>
          </>}
          {user?.role === 'COMPANY_GUARD' && (
            <NavLink to="/guard" style={navLinkStyle}>Scanner</NavLink>
          )}
        </nav>

        {/* RIGHT: THEME TOGGLE + AUTH */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {!user ? <>
            <Link to="/login" style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', borderRadius: 999,
              border: `1.5px solid ${dark ? '#4B5563' : '#D4D4D4'}`,
              background: dark ? '#1F2937' : '#fff',
              fontWeight: 600, fontSize: 14.5, color: dark ? '#F3F4F6' : '#1A1A1A',
              textDecoration: 'none', transition: 'border-color .15s, background .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = dark ? '#6B7280' : '#9A9A9A'; e.currentTarget.style.background = dark ? '#374151' : '#F6F6F4'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#4B5563' : '#D4D4D4'; e.currentTarget.style.background = dark ? '#1F2937' : '#fff'; }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Log in
            </Link>
            <Link to="/register" style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', borderRadius: 999,
              background: '#EB1700', color: '#fff',
              fontWeight: 700, fontSize: 14.5,
              textDecoration: 'none', boxShadow: '0 4px 14px rgba(235,23,0,.30)',
              transition: 'background .15s, box-shadow .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#D11400'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#EB1700'; }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Register
            </Link>
          </> : (
            <button onClick={() => setConfirmingLogout(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', borderRadius: 999,
              border: `1.5px solid ${dark ? '#4B5563' : '#D4D4D4'}`,
              background: dark ? '#1F2937' : '#fff',
              fontWeight: 600, fontSize: 14.5, color: dark ? '#F3F4F6' : '#1A1A1A',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'border-color .15s, background .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = dark ? '#6B7280' : '#9A9A9A'; e.currentTarget.style.background = dark ? '#374151' : '#F6F6F4'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? '#4B5563' : '#D4D4D4'; e.currentTarget.style.background = dark ? '#1F2937' : '#fff'; }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Log out
            </button>
          )}
        </div>

      </div>

      <ConfirmDialog
        open={confirmingLogout}
        title="Log out?"
        message="You'll need to log in again to access your dashboard."
        confirmLabel="Log out"
        onConfirm={confirmLogout}
        onCancel={() => setConfirmingLogout(false)}
      />
    </header>
  );
}
