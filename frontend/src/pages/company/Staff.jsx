import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PASSWORD_RE, EMAIL_RE } from '../../validation';

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Owner creates/deactivates guard + poster sub-accounts (max one each).
export default function Staff() {
  const [staff, setStaff] = useState(null);
  const [form, setForm] = useState({ email: '', tempPassword: '', role: 'COMPANY_GUARD' });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState(null);
  const [createdCred, setCreatedCred] = useState(null);
  const [copied, setCopied] = useState(null);

  function load() { api.get('/api/company/staff').then(setStaff).catch(() => setStaff([])); }
  useEffect(load, []);

  async function create(e) {
    e.preventDefault();
    if (busy) return;
    setErr(null); setCreatedCred(null); setBusy(true);
    try {
      await api.post('/api/company/staff', form);
      setCreatedCred({ email: form.email, tempPassword: form.tempPassword, role: form.role });
      setForm({ email: '', tempPassword: '', role: 'COMPANY_GUARD' }); load();
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed'); }
    finally { setBusy(false); }
  }
  async function deactivate() {
    const id = confirmDeactivateId; setConfirmDeactivateId(null);
    if (deactivatingId) return;
    setErr(null); setDeactivatingId(id);
    try { await api.put(`/api/company/staff/${id}/deactivate`); load(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed to deactivate'); }
    finally { setDeactivatingId(null); }
  }
  function copy(text, field) {
    navigator.clipboard?.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="page page-narrow">
      <h1>Staff</h1>
      <p className="muted">Create one active guard (scans attendance) and one active poster (manages jobs). Deactivating one frees that role for a replacement.</p>
      {err && <div className="form-error mt-16">{err}</div>}

      {createdCred && (
        <div className="staff-cred-card mt-16">
          <div className="row between">
            <strong>Account created — share these with {createdCred.role === 'COMPANY_GUARD' ? 'the guard' : 'the poster'} now</strong>
            <button type="button" className="staff-cred-close" aria-label="Dismiss" onClick={() => setCreatedCred(null)}>&times;</button>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: '4px 0 12px' }}>
            This password won't be shown again — FlexiWork only stores an encrypted copy.
          </p>
          <div className="staff-cred-row">
            <span className="cd-profile-label">Email</span>
            <code>{createdCred.email}</code>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => copy(createdCred.email, 'email')}>
              {copied === 'email' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="staff-cred-row">
            <span className="cd-profile-label">Password</span>
            <code>{createdCred.tempPassword}</code>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => copy(createdCred.tempPassword, 'pwd')}>
              {copied === 'pwd' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      <form className="card mt-16" onSubmit={create}>
        <h3>Add staff</h3>
        <div className="field mt-16"><label>Role</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="COMPANY_GUARD">Guard (attendance scanner)</option>
            <option value="COMPANY_POSTER">Poster (manages jobs)</option>
          </select></div>
        <div className="field"><label>Email</label>
          <input className="input" type="email" maxLength={120} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          {form.email && !EMAIL_RE.test(form.email) && <div className="field-error">Enter a valid email address</div>}</div>
        <div className="field">
          <label>Temporary password</label>
          <div className="pwd-wrap">
            <input className="input" type={showPw ? 'text' : 'password'} maxLength={13} value={form.tempPassword} onChange={(e) => setForm({ ...form, tempPassword: e.target.value })} required />
            <button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
              <EyeIcon open={showPw} />
            </button>
          </div>
          {form.tempPassword && !PASSWORD_RE.test(form.tempPassword) &&
            <div className="field-error">Must be 8-13 letters/numbers, with at least one letter and one number</div>}
        </div>
        <button className="btn btn-primary btn-block" disabled={busy || !EMAIL_RE.test(form.email) || !PASSWORD_RE.test(form.tempPassword)}>{busy ? 'Creating…' : 'Create staff account'}</button>
      </form>

      <div className="card mt-16">
        <h3>Existing staff</h3>
        {!staff ? <div className="skeleton skel-card" /> : staff.length === 0 ? (
          <p className="muted mt-8">No staff accounts yet.</p>
        ) : (
          <table className="mt-8">
            <thead><tr><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{s.role.replace('COMPANY_', '')}</td>
                  <td><span className={`badge ${s.active ? 'OPEN' : 'CANCELLED'}`}>{s.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                  <td>{s.active && <button className="btn btn-danger btn-sm" disabled={deactivatingId === s.id} onClick={() => setConfirmDeactivateId(s.id)}>Deactivate</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeactivateId}
        title="Deactivate this account?"
        message="The staff member will immediately lose access to their dashboard."
        confirmLabel="Deactivate"
        onConfirm={deactivate}
        onCancel={() => setConfirmDeactivateId(null)}
      />
    </div>
  );
}
