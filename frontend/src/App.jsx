import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import JobFeed from './pages/JobFeed';
import JobDetail from './pages/JobDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import HowItWorks from './pages/HowItWorks';
import Login from './pages/Login';
import RoleChoice from './pages/RoleChoice';
import WorkerRegister from './pages/WorkerRegister';
import CompanyRegister from './pages/CompanyRegister';
import ForgotPassword from './pages/ForgotPassword';

import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerProfile from './pages/worker/WorkerProfile';

import CompanyDashboard from './pages/company/CompanyDashboard';
import PostJob from './pages/company/PostJob';
import MyJobs from './pages/company/MyJobs';
import JobApplicants from './pages/company/JobApplicants';
import Payments from './pages/company/Payments';
import PayPage from './pages/company/PayPage';
import Staff from './pages/company/Staff';

import GuardKiosk from './pages/guard/GuardKiosk';

// Guard kiosk is a full-screen page without the standard navbar.
// Full-screen pages that render without the standard Navbar/Footer shell.
export default function App() {
  return (
    <Routes>
      <Route path="/guard" element={
        <ProtectedRoute roles={['COMPANY_GUARD', 'COMPANY']}><GuardKiosk /></ProtectedRoute>
      } />
      <Route path="*" element={<Shell />} />
    </Routes>
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="fw-404-wrap">
      <div className="fw-404-icon">
        <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#EB1700" strokeWidth="2"/>
          <path d="M12 7v6M12 17h.01" stroke="#EB1700" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ fontSize: 72, fontWeight: 900, color: '#EB1700', lineHeight: 1, marginBottom: 8 }}>404</div>
      <h2 className="fw-404-heading">Page not found</h2>
      <p className="fw-404-sub">The page you're looking for doesn't exist or has been moved.</p>
      <div className="fw-404-actions">
        <button className="fw-404-btn-back" onClick={() => navigate(-1)}>Go back</button>
        <button className="fw-404-btn-home" onClick={() => navigate('/')}>Home</button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="fw-footer">
      <div style={{
        maxWidth: 1080, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 20, flexWrap: 'wrap',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{
            width: 32, height: 32, borderRadius: 9, background: '#EB1700', color: '#fff',
            display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13,
            boxShadow: '0 3px 8px rgba(235,23,0,.28)', flexShrink: 0,
          }}>FW</span>
          <span className="fw-footer-brand" style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.4px' }}>
            Flexi<span style={{ color: '#EB1700' }}>Work</span>
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 28 }}>
          {[['For Workers', '/register/worker'], ['For Companies', '/register/company'], ['How It Works', '/how-it-works'], ['About Us', '/about']].map(([label, to]) => (
            <Link key={label} to={to} className="fw-footer-link"
              onMouseEnter={e => e.target.style.color = '#EB1700'}
              onMouseLeave={e => e.target.style.color = ''}>
              {label}
            </Link>
          ))}
        </nav>

        <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>© {new Date().getFullYear()} FlexiWork. Made in Sri Lanka.</span>
      </div>
    </footer>
  );
}

function Shell() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<JobFeed />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<RoleChoice />} />
        <Route path="/register/worker" element={<WorkerRegister />} />
        <Route path="/register/company" element={<CompanyRegister />} />

        {/* Worker */}
        <Route path="/worker/applications" element={
          <ProtectedRoute roles={['WORKER']}><WorkerDashboard /></ProtectedRoute>} />
        <Route path="/worker/profile" element={
          <ProtectedRoute roles={['WORKER']}><WorkerProfile /></ProtectedRoute>} />

        {/* Company + Poster */}
        <Route path="/company" element={
          <ProtectedRoute roles={['COMPANY']}><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/company/post" element={
          <ProtectedRoute roles={['COMPANY', 'COMPANY_POSTER']}><PostJob /></ProtectedRoute>} />
        <Route path="/company/jobs" element={
          <ProtectedRoute roles={['COMPANY', 'COMPANY_POSTER']}><MyJobs /></ProtectedRoute>} />
        <Route path="/company/jobs/:id/applicants" element={
          <ProtectedRoute roles={['COMPANY', 'COMPANY_POSTER']}><JobApplicants /></ProtectedRoute>} />
        <Route path="/company/payments" element={
          <ProtectedRoute roles={['COMPANY']}><Payments /></ProtectedRoute>} />
        <Route path="/company/payments/:id/pay" element={
          <ProtectedRoute roles={['COMPANY']}><PayPage /></ProtectedRoute>} />
        <Route path="/company/staff" element={
          <ProtectedRoute roles={['COMPANY']}><Staff /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
      <Footer />
    </div>
  );
}
