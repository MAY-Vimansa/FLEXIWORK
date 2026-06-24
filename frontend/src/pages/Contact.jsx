import { useState } from 'react';
import { api, ApiError } from '../api';

const TOPICS = ['Job Application', 'Payment Issue', 'My Account', 'Employer Inquiry', 'Other'];

export default function Contact() {
  const [topic, setTopic] = useState('Job Application');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setErr(null); setBusy(true);
    try {
      await api.post('/api/contact', { topic, ...form });
      setSent(true);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Failed to send message. Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <div className="contact-page" style={{ background: '#F4F4F2', minHeight: '100vh' }}>

      {/* HERO */}
      <div style={{
        background: 'radial-gradient(ellipse 80% 60% at 60% 0%, #FF3B1F 0%, rgba(255,59,31,0) 60%), linear-gradient(160deg, #EB1700 0%, #B81000 55%, #8A0A08 100%)',
        padding: '64px 32px 80px',
        textAlign: 'center',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,.06) 1px, transparent 1.4px)',
          backgroundSize: '26px 26px', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)',
            borderRadius: 999, padding: '5px 14px', fontSize: 13, fontWeight: 600,
            marginBottom: 22,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
            We're here to help
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 18 }}>
            Get in Touch<br />with FlexiWork
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.75)', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Have a question, feedback, or need support? Send us a message and we'll get back to you — fast.
          </p>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 1080, margin: '-32px auto 0', padding: '0 32px 80px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* FORM CARD */}
          <div className="contact-form-card" style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,.07)', padding: '36px 36px 32px' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F6EF', border: '2px solid #B7E8CC', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1F8A5B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Message sent!</h2>
                <p style={{ color: '#767676', fontSize: 15 }}>Thanks! Our team will reply to you within a few hours.</p>
                <button onClick={() => { setSent(false); setForm({ firstName: '', lastName: '', phone: '', email: '', message: '' }); }}
                  className="contact-resend-btn" style={{ marginTop: 24, padding: '10px 24px', borderRadius: 10, border: '1.5px solid #E2E2E2', background: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 6 }}>Send us a Message</h2>
                <p style={{ fontSize: 14, color: '#767676', marginBottom: 28 }}>Fill in the form below and our team will respond within a few hours.</p>
                {err && <div style={{ background: '#FDECEA', color: '#B71C1C', padding: '10px 14px', borderRadius: 10, fontSize: 13.5, marginBottom: 20 }}>{err}</div>}

                <form onSubmit={submit}>
                  {/* TOPIC */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: '#767676', marginBottom: 10 }}>What is this about?</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {TOPICS.map(t => (
                        <button key={t} type="button" onClick={() => setTopic(t)}
                          className={`contact-topic-btn${topic === t ? ' active' : ''}`}
                          style={{
                            padding: '7px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            border: topic === t ? '1.5px solid #EB1700' : '1.5px solid #D4D4D4',
                            background: topic === t ? '#FFF1EF' : '#fff',
                            color: topic === t ? '#EB1700' : '#3D3D3D',
                            transition: 'all .15s',
                          }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NAME ROW */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <Field label="First Name" placeholder="Kasun">
                      <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Kasun" required className="contact-input-field" style={inputStyle} />
                    </Field>
                    <Field label="Last Name" placeholder="Perera">
                      <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Perera" required className="contact-input-field" style={inputStyle} />
                    </Field>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <Field label="Phone Number">
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+94 77 123 4567" required className="contact-input-field" style={inputStyle} />
                    </Field>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <Field label={<>Email Address <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: '#9A9A9A', fontSize: 11 }}>(optional)</span></>}>
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="kasun@example.com" className="contact-input-field" style={inputStyle} />
                    </Field>
                  </div>

                  <div style={{ marginBottom: 28 }}>
                    <Field label="Your Message">
                      <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us how we can help you…" required
                        className="contact-input-field" style={{ ...inputStyle, minHeight: 120, resize: 'vertical', lineHeight: 1.5 }} />
                    </Field>
                  </div>

                  <button type="submit" disabled={busy} style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    background: '#EB1700', color: '#fff', fontWeight: 700, fontSize: 15,
                    cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                    boxShadow: '0 6px 20px rgba(235,23,0,.28)',
                    transition: 'background .15s',
                  }}
                    onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#D11400'; }}
                    onMouseLeave={e => { if (!busy) e.currentTarget.style.background = '#EB1700'; }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    {busy ? 'Sending…' : 'Send Message'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#9A9A9A', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Your information is private and never shared.
                  </p>
                </form>
              </>
            )}
          </div>

          {/* SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* CONTACT INFO */}
            <div className="contact-sidebar-card" style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,.07)', padding: '26px 24px' }}>
              <h3 className="contact-sidebar-h3" style={{ fontSize: 16, fontWeight: 800, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #ECECEC' }}>Contact Information</h3>
              {[
                {
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.1 6.1l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                  label: 'HOTLINE', value: '+94 11 234 5678', sub: 'Workers & Employers',
                },
                {
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                  label: 'EMAIL', value: 'support@flexiwork.lk', sub: 'Reply within 2–4 hours',
                },
                {
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EB1700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                  label: 'OFFICE', value: 'Colombo 03, Sri Lanka', sub: 'No. 42, Galle Road',
                },
              ].map(({ icon, label, value, sub }, i, arr) => (
                <div key={label} className={i < arr.length - 1 ? 'contact-info-row' : 'contact-info-row-last'} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingBottom: i < arr.length - 1 ? 16 : 0, marginBottom: i < arr.length - 1 ? 16 : 0, borderBottom: i < arr.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                  <div className="contact-icon-box" style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF1EF', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div className="contact-info-label" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: '#9A9A9A', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#EB1700' }}>{value}</div>
                    <div className="contact-info-sub" style={{ fontSize: 12.5, color: '#767676', marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* SUPPORT HOURS */}
            <div className="contact-sidebar-card" style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,.07)', padding: '26px 24px' }}>
              <h3 className="contact-sidebar-h3 no-border" style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>Support Hours</h3>
              {[
                { day: 'Monday – Friday', hours: '8 AM – 10 PM' },
                { day: 'Saturday',        hours: '9 AM – 8 PM' },
                { day: 'Sunday',          hours: '10 AM – 6 PM' },
                { day: 'Hotline',         hours: '24 / 7' },
              ].map(({ day, hours }) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 14 }}>
                  <span className="contact-day-text" style={{ color: '#3D3D3D', fontWeight: 500 }}>{day}</span>
                  <span style={{ fontWeight: 700, color: '#1F8A5B' }}>{hours}</span>
                </div>
              ))}
            </div>

            {/* FOLLOW US */}
            <div className="contact-sidebar-card" style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,.07)', padding: '26px 24px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Follow Us</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Facebook',   color: '#1877F2', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
                  { label: 'Instagram',  color: '#E1306C', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> },
                  { label: 'WhatsApp',   color: '#25D366', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> },
                  { label: 'Twitter / X', color: '#000', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                ].map(({ label, color, icon }) => (
                  <button key={label} className="contact-social-btn" style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #E2E2E2', background: '#fff',
                    fontWeight: 600, fontSize: 13.5, color: '#1A1A1A',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'border-color .15s, background .15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E2E2'; e.currentTarget.style.color = '#1A1A1A'; }}>
                    <span style={{ color }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* RESPONSIVE */}
      <style>{`
        @media (max-width: 860px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="contact-field-label" style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', color: '#767676', marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid #E2E2E2', borderRadius: 10,
  fontSize: 15, color: '#1A1A1A', background: '#fff',
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color .15s, box-shadow .15s',
};
