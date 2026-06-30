import { Link } from 'react-router-dom';

const DOT_GRID = `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.15)'/%3E%3C/svg%3E")`;

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Apply in Seconds, Not Days',
    desc: 'Our streamlined application process means you can apply to a job in under 30 seconds. No cover letters, no waiting rooms — just tap and go.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    title: 'Cash in Hand, Same Day',
    desc: 'Your wages are processed automatically when your shift ends. Cash in hand — no chasing employers, no delays, no excuses.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Verified, Safe Employers Only',
    desc: 'Every company on FlexiWork is verified before they can post a single job. We vet their registration, workplace safety record, and payment history so you don\'t have to.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'A Community, Not Just a Job Board',
    desc: 'Over 10,000 workers have already found daily jobs through FlexiWork. Join a growing community of people who work on their own terms and earn with confidence.',
  },
];

export default function About() {
  return (
    <div className="about-page" style={{ fontFamily: 'inherit' }}>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg, #EB1700 0%, #B81000 60%, #8B0000 100%)',
        backgroundImage: `${DOT_GRID}, linear-gradient(135deg, #EB1700 0%, #B81000 60%, #8B0000 100%)`,
        padding: '100px 24px 140px',
        textAlign: 'center',
        position: 'relative',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.25)',
          borderRadius: 999, padding: '6px 16px',
          fontSize: 13, fontWeight: 700, color: '#fff',
          letterSpacing: '.3px', marginBottom: 28,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
          Our Story
        </span>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900,
          color: '#fff', lineHeight: 1.1, margin: '0 auto 20px',
          maxWidth: 780, letterSpacing: '-1.5px',
        }}>
          Connecting Sri Lanka's Workers with{' '}
          <span style={{ color: 'rgba(255,255,255,.55)' }}>Real Opportunity</span>
        </h1>

        <p style={{
          fontSize: 17, color: 'rgba(255,255,255,.78)', maxWidth: 520,
          margin: '0 auto', lineHeight: 1.6,
        }}>
          FlexiWork was built to give every Sri Lankan worker access to daily jobs, fair wages, and a better tomorrow.
        </p>

        {/* Stats bar overlapping */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16, maxWidth: 900, margin: '64px auto -80px',
          position: 'relative', zIndex: 2,
        }}>
          {[
            { val: '2026', lbl: 'Year Founded' },
            { val: '10K+', lbl: 'Workers Placed' },
            { val: '100+', lbl: 'Partner Companies' },
            { val: '25', lbl: 'Districts Covered' },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="about-stat-card" style={{
              background: '#fff', borderRadius: 16,
              padding: '28px 20px', textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,.10)',
            }}>
              <div className="about-stat-val" style={{ fontSize: 30, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-1px' }}>{val}</div>
              <div className="about-stat-lbl" style={{ fontSize: 13, color: '#7A7A7A', marginTop: 4, fontWeight: 500 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STORY SECTION ── */}
      <section className="about-section-bg" style={{ background: '#F5F5F3', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="about-badge" style={{
              display: 'inline-block', background: '#FFF1EF', color: '#EB1700',
              fontWeight: 700, fontSize: 12, letterSpacing: '1.2px',
              textTransform: 'uppercase', padding: '6px 16px', borderRadius: 999,
              marginBottom: 18,
            }}>OUR STORY</span>
            <h2 className="about-section-title" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-1px', marginBottom: 12 }}>
              How FlexiWork Began
            </h2>
            <p className="about-section-sub" style={{ fontSize: 16, color: '#7A7A7A', maxWidth: 480, margin: '0 auto' }}>
              A simple idea to solve a real problem faced by millions of Sri Lankan workers every day.
            </p>
          </div>

          {/* 2-col story card */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            borderRadius: 24, overflow: 'hidden',
            boxShadow: '0 4px 32px rgba(0,0,0,.08)',
          }}>
            {/* Left — red */}
            <div style={{
              background: 'linear-gradient(135deg, #EB1700 0%, #A50F00 100%)',
              backgroundImage: `${DOT_GRID}, linear-gradient(135deg, #EB1700 0%, #A50F00 100%)`,
              padding: '48px 40px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.4px', color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', marginBottom: 24 }}>
                FOUNDED IN SRI LANKA
              </div>
              <h3 style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 24, letterSpacing: '-0.5px' }}>
                We saw workers left without a voice.
              </h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,.8)', lineHeight: 1.7, marginBottom: 36 }}>
                Daily workers across Sri Lanka were struggling to find consistent work. Job boards were made for full-time roles. Employers had no reliable way to hire for a single shift. FlexiWork was born to fix that — a platform purpose-built for the daily workforce.
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'rgba(0,0,0,.2)', borderRadius: 999,
                padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 600,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                2026 — Colombo, Sri Lanka
              </div>
            </div>

            {/* Right — white */}
            <div className="about-story-white" style={{ background: '#fff', padding: '48px 40px', display: 'flex', flexDirection: 'column', gap: 36 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.4px', color: '#EB1700', textTransform: 'uppercase', marginBottom: 12 }}>
                  OUR MISSION
                </div>
                <h4 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', marginBottom: 10, letterSpacing: '-0.3px' }}>
                  Dignified Work for Every Sri Lankan
                </h4>
                <p style={{ fontSize: 14.5, color: '#5A5A5A', lineHeight: 1.7 }}>
                  We believe every worker deserves a fair shot. Our mission is to make daily employment accessible, transparent, and rewarding — connecting the right worker with the right job, every single day across all 25 districts of Sri Lanka.
                </p>
              </div>
              <div className="about-story-divider" style={{ borderTop: '1px solid #F0F0EE', paddingTop: 36 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.4px', color: '#EB1700', textTransform: 'uppercase', marginBottom: 12 }}>
                  OUR VISION
                </div>
                <h4 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', marginBottom: 10, letterSpacing: '-0.3px' }}>
                  Sri Lanka's Most Trusted Workforce Platform
                </h4>
                <p style={{ fontSize: 14.5, color: '#5A5A5A', lineHeight: 1.7 }}>
                  We're building the infrastructure for a flexible, modern labour market — where workers have freedom, employers have reliability, and payments always arrive on time. No middlemen, no delays, no uncertainty.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY FLEXIWORK ── */}
      <section className="about-section-bg" style={{ background: '#F5F5F3', padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="about-badge" style={{
              display: 'inline-block', background: '#FFF1EF', color: '#EB1700',
              fontWeight: 700, fontSize: 12, letterSpacing: '1.2px',
              textTransform: 'uppercase', padding: '6px 16px', borderRadius: 999,
              marginBottom: 18,
            }}>WHY FLEXIWORK</span>
            <h2 className="about-section-title" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-1px', marginBottom: 16 }}>
              Built Different, for Workers First
            </h2>
            <p className="about-section-sub" style={{ fontSize: 16, color: '#7A7A7A', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
              We didn't copy an existing job board. We built something entirely new — designed around how daily work actually happens.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="about-feature-card" style={{
                background: '#fff', borderRadius: 18,
                padding: '28px 28px', display: 'flex', gap: 18, alignItems: 'flex-start',
                boxShadow: '0 2px 12px rgba(0,0,0,.05)',
              }}>
                <div className="about-feature-icon" style={{
                  width: 44, height: 44, borderRadius: 12, background: '#FFF1EF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <div className="about-feature-title" style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', marginBottom: 8, letterSpacing: '-0.2px' }}>{f.title}</div>
                  <div className="about-feature-desc" style={{ fontSize: 14, color: '#5A5A5A', lineHeight: 1.65 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOTLINE CTA ── */}
      <section className="about-section-bg" style={{ background: '#F5F5F3', padding: '0 24px 80px' }}>
        <div style={{
          maxWidth: 960, margin: '0 auto',
          background: 'linear-gradient(135deg, #EB1700 0%, #A50F00 100%)',
          backgroundImage: `${DOT_GRID}, linear-gradient(135deg, #EB1700 0%, #A50F00 100%)`,
          borderRadius: 28, padding: '72px 40px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {/* decorative circles */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.25)',
            borderRadius: 999, padding: '6px 16px',
            fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 24,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', boxShadow: '0 0 6px #4ADE80' }} />
            We're Available Right Now
          </span>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: '#fff',
            letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 16,
          }}>
            Need Help? Call Our<br />
            <span style={{ color: 'rgba(255,255,255,.6)' }}>Worker Hotline</span>
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.78)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Have a question about a job, your payment, or your application? Our team is standing by to help you — in Sinhala, Tamil, and English.
          </p>

          {/* Phone card */}
          <div className="about-hotline-card" style={{
            display: 'inline-flex', alignItems: 'center', gap: 16,
            background: '#fff', borderRadius: 16, padding: '18px 36px',
            boxShadow: '0 8px 32px rgba(0,0,0,.15)', marginBottom: 20,
          }}>
            <div className="about-hotline-icon-box" style={{
              width: 44, height: 44, borderRadius: 12, background: '#FFF1EF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16z"/>
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="about-hotline-label" style={{ fontSize: 11, fontWeight: 700, color: '#9A9A9A', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>WORKER HOTLINE</div>
              <div className="about-hotline-number" style={{ fontSize: 24, fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.5px' }}>+94 11 234 5678</div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Available 24 hours a day, 7 days a week
          </div>
        </div>
      </section>

    </div>
  );
}
