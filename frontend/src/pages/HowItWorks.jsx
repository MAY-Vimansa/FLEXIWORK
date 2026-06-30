import { Link } from 'react-router-dom';

import logoAitken    from '../assets/logos/aitken.png';
import logoBrandix   from '../assets/logos/brandix.png';
import logoCargills  from '../assets/logos/cargills.png';
import logoCombank   from '../assets/logos/combank.png';
import logoDialog    from '../assets/logos/dialog.png';
import logoExpolanka from '../assets/logos/expolanka.png';
import logoHayleys   from '../assets/logos/hayleys.png';
import logoHemas     from '../assets/logos/hemas.png';
import logoJkh       from '../assets/logos/jkh.png';
import logoMas       from '../assets/logos/mas.png';
import logoSampath   from '../assets/logos/sampath.png';
import logoSrilankan from '../assets/logos/srilankan.png';

const LOGOS = [
  { src: logoBrandix,   name: 'Brandix' },
  { src: logoCargills,  name: 'Cargills' },
  { src: logoHayleys,   name: 'Hayleys' },
  { src: logoJkh,       name: 'John Keells' },
  { src: logoHemas,     name: 'Hemas' },
  { src: logoDialog,    name: 'Dialog' },
  { src: logoMas,       name: 'MAS Holdings' },
  { src: logoExpolanka, name: 'Expolanka' },
  { src: logoAitken,    name: 'Aitken Spence' },
  { src: logoCombank,   name: 'Commercial Bank' },
  { src: logoSampath,   name: 'Sampath Bank' },
  { src: logoSrilankan, name: 'SriLankan Airlines' },
];

const SERVICES = [
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
    title: 'Job Matching & Shift Finding',
    desc: 'Our smart system matches you with daily shifts that fit your location, skills, and schedule. Browse hundreds of fresh job listings every day across all 25 districts of Sri Lanka.',
    tags: ['Location-based', 'Skill filters', '500+ listings'],
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    title: 'Same-Day Payment',
    desc: 'Finish your shift and get paid that same day — directly to your bank account or mobile wallet. No waiting, no delays. Your earnings arrive before you go to sleep.',
    tags: ['Cash in Hand'],
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    title: 'Mobile App Access <br/> (Coming Soon)',
    desc: 'Manage your entire work life from your smartphone. Apply for jobs, track your shifts, view your earnings, and chat with employers — all from the FlexiWork app, available free on Android.',
    tags: ['Android app', 'Push alerts', 'Free forever'],
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
    title: 'Flexible Scheduling',
    desc: 'You choose when you work. Pick morning, afternoon, or night shifts that fit around your life. Accept or decline job offers with a single tap — no commitment, full freedom.',
    tags: ['Pick your hours', 'Any district', 'No lock-in'],
  },
  {
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    title: '24/7 Worker Support',
    desc: 'Got a question at 2 AM? We\'re here. Our support team is available around the clock via chat and phone to help you with applications, payments, or anything else you need.',
    tags: ['Live chat', 'Phone support', 'Sinhala & Tamil'],
  },
];

const STEPS = [
  {
    n: 1,
    title: 'Create Your Free Profile',
    desc: 'Sign up in under 2 minutes. Add your name, location, skills, and preferred work types. No CV needed — just your phone number and NIC.',
  },
  {
    n: 2,
    title: 'Browse & Apply to Shifts',
    desc: 'Search jobs by district, wage, or category. Found something you like? Tap "Apply Now" — employers are notified instantly and confirm automatically.',
  },
  {
    n: 3,
    title: 'Work & Get Paid Today',
    desc: 'Complete your shift and your payment is processed automatically. Funds coming in cash in hand — no chasing, no paperwork.',
  },
];

export default function HowItWorks() {
  return (
    <div className="hiw-page" style={{ background: '#F4F4F2' }}>
      <style>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .hw-marquee-track {
          display: flex;
          width: max-content;
          animation: marqueeScroll 28s linear infinite;
        }
        .hw-marquee-track:hover { animation-play-state: paused; }
        .hw-service-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #E8E8E8;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 860px) {
          .hw-services-grid { grid-template-columns: 1fr !important; }
          .hw-steps-grid    { grid-template-columns: 1fr !important; }
          .hw-stats-grid    { grid-template-columns: 1fr 1fr !important; }
          .hw-hero-btns     { flex-direction: column !important; align-items: center !important; }
          .hw-hero-h1       { font-size: 36px !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{
        background: 'radial-gradient(ellipse 90% 70% at 70% -10%, #FF3B1F 0%, rgba(255,59,31,0) 55%), linear-gradient(155deg, #EB1700 0%, #C01000 45%, #8A0A08 100%)',
        padding: '90px 32px 100px',
        textAlign: 'center',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.06) 1px, transparent 1.4px)', backgroundSize: '26px 26px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.28)', borderRadius: 999, padding: '6px 18px', fontSize: 13, fontWeight: 600, marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', opacity: .9 }} />
            Built for workers across Sri Lanka
          </div>
          <h1 className="hw-hero-h1" style={{ fontSize: 58, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.08, marginBottom: 22 }}>
            Everything You Need<br />
            to <span style={{ color: 'rgba(255,255,255,.65)' }}>Work & Earn</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.78)', lineHeight: 1.65, marginBottom: 40 }}>
            FlexiWork gives you the tools to find daily shifts, get paid same<br />day, and grow your income — all from your phone.
          </p>
          <div className="hw-hero-btns" style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
            <Link to="/register/worker" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 999, background: '#fff', color: '#EB1700', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 6px 24px rgba(0,0,0,.15)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Register as a Worker
            </Link>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 999, background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div style={{ maxWidth: 1080, margin: '-36px auto 0', padding: '0 32px', position: 'relative', zIndex: 2 }}>
        <div className="hw-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[['500+','Daily Jobs Listed'],['10K+','Workers Placed'],['100+','Partner Companies'],['24/7','Support Available']].map(([val, lbl]) => (
            <div key={lbl} className="hiw-stat-card" style={{ background: '#fff', borderRadius: 18, padding: '28px 24px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
              <div className="hiw-stat-val" style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1.5px', color: '#1A1A1A' }}>{val}</div>
              <div className="hiw-stat-lbl" style={{ fontSize: 14, color: '#767676', marginTop: 6, fontWeight: 500 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 32px 72px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="hiw-badge" style={{ display: 'inline-block', background: '#FFF1EF', color: '#EB1700', fontWeight: 700, fontSize: 12, letterSpacing: '1px', textTransform: 'uppercase', padding: '6px 16px', borderRadius: 999, marginBottom: 18 }}>Our Services</div>
          <h2 className="hiw-section-title" style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1.2px', marginBottom: 14 }}>Everything You Need in One Place</h2>
          <p className="hiw-section-sub" style={{ fontSize: 16, color: '#767676', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>Five powerful features designed to make finding work fast, simple, and rewarding.</p>
        </div>

        {/* 3-col top row */}
        <div className="hw-services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
          {SERVICES.slice(0, 3).map(s => <ServiceCard key={s.title} {...s} />)}
        </div>
        {/* 2-col bottom row */}
        <div className="hw-services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {SERVICES.slice(3).map(s => <ServiceCard key={s.title} {...s} />)}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{
        background: 'radial-gradient(ellipse 80% 60% at 80% 50%, #FF3B1F 0%, rgba(255,59,31,0) 55%), linear-gradient(135deg, #EB1700 0%, #B81000 100%)',
        padding: '72px 32px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.055) 1px, transparent 1.4px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 48, color: '#fff' }}>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '1px', textTransform: 'uppercase', padding: '6px 16px', borderRadius: 999, marginBottom: 20 }}>How It Works</div>
            <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1.2px', marginBottom: 12 }}>Start Earning in <span style={{ color: 'rgba(255,255,255,.65)' }}>3 Simple Steps</span></h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.72)', lineHeight: 1.6 }}>From sign-up to your first paycheck — it only takes minutes.</p>
          </div>

          <div className="hiw-steps-panel" style={{ background: '#fff', borderRadius: 24, padding: '44px 48px' }}>
            <div className="hw-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
              {STEPS.map((step, i) => (
                <div key={step.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', padding: '0 24px' }}>
                  {/* connector line */}
                  {i < STEPS.length - 1 && (
                    <div style={{ position: 'absolute', top: 22, left: '50%', right: 0, height: 2, borderTop: '2px dashed #FFD5D0', zIndex: 0 }} />
                  )}
                  <div className="hiw-step-circle" style={{ width: 48, height: 48, borderRadius: '50%', background: '#FFF1EF', border: '2px solid #FFD5D0', display: 'grid', placeItems: 'center', marginBottom: 22, position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#EB1700' }}>{step.n}</span>
                  </div>
                  <h3 className="hiw-step-title" style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, letterSpacing: '-.3px' }}>{step.title}</h3>
                  <p className="hiw-step-desc" style={{ fontSize: 14, color: '#767676', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 32px' }}>
        <div className="hiw-trusted-card" style={{ background: '#fff', borderRadius: 24, padding: '36px 0', boxShadow: '0 2px 16px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          <div className="hiw-trusted-label" style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#9A9A9A', marginBottom: 28 }}>
            Trusted by Sri Lanka's Leading Employers
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="hw-marquee-track">
              {[...LOGOS, ...LOGOS].map((logo, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 36px', flexShrink: 0 }}>
                  <img src={logo.src} alt={logo.name} style={{ height: 36, width: 'auto', objectFit: 'contain', filter: 'grayscale(40%) opacity(0.75)', transition: 'filter .2s' }}
                    onMouseEnter={e => e.currentTarget.style.filter = 'grayscale(0%) opacity(1)'}
                    onMouseLeave={e => e.currentTarget.style.filter = 'grayscale(40%) opacity(0.75)'}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px 80px' }}>
        <div style={{
          background: 'radial-gradient(ellipse 60% 80% at 85% 50%, rgba(180,20,0,.6) 0%, transparent 60%), linear-gradient(135deg, #EB1700 0%, #B81000 100%)',
          borderRadius: 28,
          padding: '70px 48px',
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.055) 1px, transparent 1.4px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 18 }}>
              Ready to Start<br /><span style={{ color: 'rgba(255,255,255,.65)' }}>Earning Today?</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.75)', lineHeight: 1.65, marginBottom: 36 }}>
              Join over 10,000 workers already using FlexiWork to find daily shifts, get paid fast, and work on their own terms.
            </p>
            <Link to="/register/worker" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 32px', borderRadius: 999, background: '#fff', color: '#EB1700', fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 28px rgba(0,0,0,.18)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Register as a Worker — Free
            </Link>
            <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              No fees, no commitments. Cancel anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ icon, title, desc, tags }) {
  return (
    <div className="hw-service-card">
      <div className="hiw-icon-box" style={{ width: 52, height: 52, borderRadius: 14, background: '#FFF1EF', display: 'grid', placeItems: 'center', marginBottom: 22, flexShrink: 0 }}>
        {icon}
      </div>
      <h3 className="hiw-service-title" style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.3px', marginBottom: 12 }}>{title}</h3>
      <p className="hiw-service-desc" style={{ fontSize: 14, color: '#767676', lineHeight: 1.65, flex: 1 }}>{desc}</p>
      <div className="hiw-tag-divider" style={{ borderTop: '1px solid #F0F0F0', marginTop: 22, paddingTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map(t => (
          <span key={t} className="hw-tag-chip" style={{ padding: '5px 12px', borderRadius: 999, border: '1.5px solid #E2E2E2', fontSize: 12.5, fontWeight: 600, color: '#3D3D3D' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
