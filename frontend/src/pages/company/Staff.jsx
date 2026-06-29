import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../../api';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PASSWORD_RE, EMAIL_RE } from '../../validation';

const ROLES = [
  { value: 'COMPANY_GUARD', label: 'Guard', hint: 'Scans attendance', letter: 'G' },
  { value: 'COMPANY_POSTER', label: 'Poster', hint: 'Manages jobs', letter: 'P' },
];

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
  const emailRef = useRef(null);

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
  function assign(role) {
    setForm((f) => ({ ...f, role }));
    setErr(null);
    emailRef.current?.focus();
    emailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const activeFor = (role) => Array.isArray(staff) ? staff.find((s) => s.role === role && s.active) : null;
  const filled = ROLES.reduce((n, r) => n + (activeFor(r.value) ? 1 : 0), 0);

  const emailValid = EMAIL_RE.test(form.email);
  const pwValid = PASSWORD_RE.test(form.tempPassword);

  return (
    <div className="page st">
      <div className="st-header">
        <h1 className="st-title">Staff</h1>
        <span className="st-seats">{filled} of {ROLES.length} seats filled</span>
      </div>
      <p className="st-sub">
        Keep one active guard (scans attendance) and one active poster (manages jobs).
        Deactivating a role frees the seat for a replacement.
      </p>

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

      <div className="st-grid">
        {/* Add staff */}
        <form className="st-card" onSubmit={create}>
          <h3 className="st-card-title">Add staff</h3>

          <div className="st-field">
            <label className="st-label">Role</label>
            <div className="st-roles" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {ROLES.map((r) => {
                const selected = form.role === r.value;
                return (
                  <button
                    type="button"
                    key={r.value}
                    className={`st-role ${selected ? 'is-selected' : ''}`}
                    onClick={() => setForm({ ...form, role: r.value })}
                    aria-pressed={selected}
                  >
                    <span className={`st-radio ${selected ? 'is-on' : ''}`} />
                    <span className="st-role-text">
                      <span className="st-role-name">{r.label}</span>
                      <span className="st-role-hint">{r.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="st-field">
            <label className="st-label">Email</label>
            <input
              ref={emailRef}
              className="st-input" type="email" maxLength={120}
              placeholder="name@lankaharvest.lk"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            {form.email && !emailValid && <div className="field-error">Enter a valid email address</div>}
          </div>

          <div className="st-field">
            <label className="st-label">Temporary password</label>
            <div className="st-pwd">
              <input
                className="st-input" type={showPw ? 'text' : 'password'} maxLength={13}
                placeholder="Set a temporary password"
                value={form.tempPassword}
                onChange={(e) => setForm({ ...form, tempPassword: e.target.value })}
                required
              />
              <button type="button" className="st-show" onClick={() => setShowPw((v) => !v)}>
                {showPw ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            {form.tempPassword && !pwValid &&
              <div className="field-error">Must be 8-13 letters/numbers, with at least one letter and one number</div>}
          </div>

          <button className="st-create" disabled={busy || !emailValid || !pwValid}>
            {busy ? 'Creating…' : 'Create staff account'}
          </button>
        </form>

        {/* Existing staff */}
        <div className="st-card">
          <h3 className="st-card-title">Existing staff</h3>
          <p className="st-card-sub">One seat per role.</p>

          {!staff ? (
            <div className="skeleton skel-card mt-8" />
          ) : (
            <div className="st-seats-list">
              {ROLES.map((r) => {
                const acct = activeFor(r.value);
                if (acct) {
                  return (
                    <div key={r.value} className="st-seat">
                      <div className="st-avatar">{(acct.email || r.letter).charAt(0).toUpperCase()}</div>
                      <div className="st-seat-body">
                        <div className="st-seat-email">{acct.email}</div>
                        <div className="st-seat-meta">
                          <span className="st-seat-role">{r.label.toUpperCase()}</span>
                          <span className="badge OPEN">ACTIVE</span>
                        </div>
                      </div>
                      <button
                        className="st-deactivate"
                        disabled={deactivatingId === acct.id}
                        onClick={() => setConfirmDeactivateId(acct.id)}
                      >Deactivate</button>
                    </div>
                  );
                }
                return (
                  <div key={r.value} className="st-seat is-empty">
                    <div className="st-avatar is-empty">{r.letter}</div>
                    <div className="st-seat-body">
                      <div className="st-seat-email is-muted">No active {r.label.toLowerCase()}</div>
                      <div className="st-seat-empty-hint">Add one to let someone {r.value === 'COMPANY_GUARD' ? 'scan attendance' : 'manage jobs'}.</div>
                    </div>
                    <button className="st-assign" onClick={() => assign(r.value)}>Assign</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
