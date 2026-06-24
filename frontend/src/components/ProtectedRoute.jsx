import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

const COMPANY_ROLES = ['COMPANY', 'COMPANY_GUARD', 'COMPANY_POSTER'];

// Guards a route by authentication and (optionally) allowed roles. Redirects to /login when
// unauthenticated and to the feed when the role is not permitted. A suspended company (overdue
// payment) is blocked behind a full-screen notice instead of the requested page.
export default function ProtectedRoute({ roles, children }) {
  const { user, suspended } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  if (suspended && COMPANY_ROLES.includes(user.role)) {
    return <SuspendedNotice />;
  }
  return children;
}

function SuspendedNotice() {
  const { logout } = useAuth();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F5F5F5', padding: '40px 20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%',
        textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.08)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: '#FFF0EE',
          display: 'grid', placeItems: 'center', margin: '0 auto 24px',
        }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z" fill="#EB1700"/>
          </svg>
        </div>
        <div style={{
          display: 'inline-block', background: '#FFF0EE', color: '#EB1700',
          fontWeight: 700, fontSize: 12, letterSpacing: '.5px', textTransform: 'uppercase',
          padding: '4px 14px', borderRadius: 20, marginBottom: 16,
        }}>Account Suspended</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', margin: '0 0 16px' }}>
          Payment Overdue
        </h2>
        <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, margin: '0 0 28px' }}>
          Your company has an outstanding FlexiWork commission payment. All account actions are
          paused until the balance is settled.
        </p>
        <div style={{
          background: '#F5F5F5', borderRadius: 12, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, textAlign: 'left',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#fff',
            display: 'grid', placeItems: 'center', flexShrink: 0,
            boxShadow: '0 1px 4px rgba(0,0,0,.1)',
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#767676"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#767676', fontWeight: 600, marginBottom: 2 }}>CONTACT SUPPORT</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>support@flexiwork.lk</div>
          </div>
        </div>
        <button onClick={logout} style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: '#EB1700', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
        }}>Log out</button>
      </div>
    </div>
  );
}
