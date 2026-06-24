import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api';
import AccountSettings from './AccountSettings';

// View/edit worker profile. NIC details are read-only here (immutable after verification).
export default function WorkerProfile() {
  const [profile, setProfile] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [form, setForm] = useState({ fullName: '', district: '', skills: '', latitude: null, longitude: null });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    api.get('/api/reference/districts').then(setDistricts).catch(() => {});
    api.get('/api/worker/profile').then((p) => {
      setProfile(p);
      setForm({ fullName: p.fullName, district: p.district, skills: p.skills || '', latitude: p.latitude, longitude: p.longitude });
    }).catch(() => {});
  }, []);

  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setMsg(null); setErr(null); setFieldErrors({}); setBusy(true);
    try {
      const d = districts.find((x) => x.name === form.district);
      const body = { ...form, latitude: form.latitude ?? d?.centerLat, longitude: form.longitude ?? d?.centerLng };
      const updated = await api.put('/api/worker/profile', body);
      setProfile(updated); setMsg('Profile updated.');
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) setFieldErrors(e.fieldErrors);
      setErr(e instanceof ApiError ? e.message : 'Update failed');
    } finally { setBusy(false); }
  }

  async function uploadPhoto(file) {
    if (uploadingPhoto) return;
    setMsg(null); setErr(null); setUploadingPhoto(true);
    try {
      const fd = new FormData(); fd.append('photo', file);
      const updated = await api.postForm('/api/worker/profile/photo', fd);
      setProfile(updated); setMsg('Photo updated.');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Photo upload failed');
    } finally { setUploadingPhoto(false); }
  }

  if (!profile) return <div className="page"><div className="skeleton skel-card" /></div>;

  return (
    <div className="page page-narrow">
      <h1>My profile</h1>
      <div className="row between mt-8">
        <span className="muted">Verification status</span>
        <span className={`badge ${profile.status}`}>{profile.status}</span>
      </div>
      {msg && <div className="form-ok mt-16">{msg}</div>}
      {err && <div className="form-error mt-16">{err}</div>}

      <form className="card mt-16" onSubmit={save}>
        <div className="qr-box">
          {profile.profilePhotoPath
            ? <img src={`/api/files/${profile.profilePhotoPath}`} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }} />
            : <div className="logo" style={{ width: 96, height: 96, fontSize: 32, margin: '0 auto' }}>{profile.fullName[0]}</div>}
          <div className="mt-8">
            <label className={`btn btn-secondary btn-sm${uploadingPhoto ? ' disabled' : ''}`}>{uploadingPhoto ? 'Uploading…' : 'Change photo'}
              <input type="file" accept="image/*" hidden disabled={uploadingPhoto} onChange={(e) => e.target.files[0] && uploadPhoto(e.target.files[0])} />
            </label>
          </div>
        </div>

        <div className="field"><label>Full name</label>
          <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          {fieldErrors.fullName && <div className="field-error">{fieldErrors.fullName}</div>}</div>
        <div className="field"><label>NIC number (locked)</label>
          <input className="input" value={profile.nicNumber} disabled /></div>
        <div className="field"><label>WhatsApp {profile.whatsappVerified ? '✅ verified' : '⚠️ unverified'}</label>
          <input className="input" value={profile.whatsappNumber || ''} disabled /></div>
        <div className="field"><label>District</label>
          <select className="input" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value, latitude: null, longitude: null })}>
            {districts.map((d) => <option key={d.name} value={d.name}>{d.name.replaceAll('_', ' ')}</option>)}
          </select></div>
        <div className="field"><label>Skills</label>
          <input className="input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>

      <AccountSettings />
    </div>
  );
}
