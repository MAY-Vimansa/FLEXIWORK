import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../api';
import MapPicker from '../../components/MapPicker';
import { geocodeAddress } from '../../geocode';

// Post a job with a Leaflet pin. Supports "use my registered company location" pre-fill.
export default function PostJob() {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category: '', district: '', addressLine: '',
    jobDate: '', startTime: '09:00', endTime: '17:00', dailyWage: '', workersNeeded: 1,
  });
  const [pin, setPin] = useState({ lat: null, lng: null });
  const [center, setCenter] = useState(null);
  const [err, setErr] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    api.get('/api/reference/districts').then(setDistricts).catch(() => {});
    api.get('/api/reference/categories').then(setCategories).catch(() => {});
  }, []);

  // Debounced: typing a real address geocodes and drops the pin automatically.
  useEffect(() => {
    const address = form.addressLine.trim();
    if (address.length < 5) return;
    const controller = new AbortController();
    const query = form.district ? `${address}, ${form.district.replaceAll('_', ' ')}, Sri Lanka` : `${address}, Sri Lanka`;
    const timer = setTimeout(async () => {
      setLocating(true);
      try {
        const loc = await geocodeAddress(query, controller.signal);
        if (loc) { setPin(loc); setCenter(loc); }
      } catch (e) {
        if (e.name !== 'AbortError') { /* ignore lookup failures, user can still pin manually */ }
      } finally { setLocating(false); }
    }, 800);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [form.addressLine, form.district]);

  function onDistrict(name) {
    setForm({ ...form, district: name });
    const d = districts.find((x) => x.name === name);
    if (d) { setCenter({ lat: d.centerLat, lng: d.centerLng }); setPin({ lat: d.centerLat, lng: d.centerLng }); }
  }
  function fe(n) { return fieldErrors[n] && <div className="field-error">{fieldErrors[n]}</div>; }

  async function submit(e) {
    e.preventDefault(); setErr(null); setFieldErrors({}); setBusy(true);
    try {
      if (!form.title.trim()) { setErr('Enter a job title'); setBusy(false); return; }
      if (!form.description.trim()) { setErr('Enter a job description'); setBusy(false); return; }
      if (!form.category) { setErr('Select a category'); setBusy(false); return; }
      if (!form.district) { setErr('Select a district'); setBusy(false); return; }
      if (!form.jobDate) { setErr('Select a job date'); setBusy(false); return; }
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(form.jobDate) < today) { setErr('Job date cannot be in the past'); setBusy(false); return; }
      if (form.endTime === form.startTime) { setErr('Start and end time cannot be the same'); setBusy(false); return; }
      if (!pin.lat) { setErr('Drop a pin on the job location'); setBusy(false); return; }
      if (!(Number(form.dailyWage) > 0)) { setErr('Daily wage must be greater than 0'); setBusy(false); return; }
      const workers = Number(form.workersNeeded);
      if (!(workers >= 1 && workers <= 500)) { setErr('Workers needed must be between 1 and 500'); setBusy(false); return; }
      const body = {
        ...form,
        dailyWage: Number(form.dailyWage),
        workersNeeded: Number(form.workersNeeded),
        startTime: form.startTime + ':00',
        endTime: form.endTime + ':00',
        latitude: pin.lat, longitude: pin.lng,
      };
      await api.post('/api/jobs', body);
      navigate('/company/jobs');
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length) setFieldErrors(e.fieldErrors);
      setErr(e instanceof ApiError ? e.message : 'Failed to post job');
    } finally { setBusy(false); }
  }

  return (
    <div className="page page-narrow">
      <h1>Post a job</h1>
      {err && <div className="form-error mt-16">{err}</div>}
      <form className="card mt-16" onSubmit={submit}>
        <div className="field"><label>Title</label>
          <input className="input" required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />{fe('title')}</div>
        <div className="field"><label>Description</label>
          <textarea className="input" required maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />{fe('description')}</div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c} value={c}>{c.replaceAll('_', ' ')}</option>)}
            </select>{fe('category')}</div>
          <div className="field" style={{ flex: 1 }}><label>District</label>
            <select className="input" value={form.district} onChange={(e) => onDistrict(e.target.value)}>
              <option value="">Select…</option>
              {districts.map((d) => <option key={d.name} value={d.name}>{d.name.replaceAll('_', ' ')}</option>)}
            </select>{fe('district')}</div>
        </div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>Date</label>
            <input className="input" type="date" required min={new Date().toISOString().slice(0, 10)} value={form.jobDate} onChange={(e) => setForm({ ...form, jobDate: e.target.value })} />{fe('jobDate')}</div>
          <div className="field" style={{ flex: 1 }}><label>Daily wage (LKR)</label>
            <input className="input" type="number" min="0.01" step="0.01" value={form.dailyWage} onChange={(e) => setForm({ ...form, dailyWage: e.target.value })} />{fe('dailyWage')}</div>
        </div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>Start</label>
            <input className="input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
          <div className="field" style={{ flex: 1 }}><label>End</label>
            <input className="input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            {form.endTime && form.startTime && form.endTime <= form.startTime &&
              <p className="muted">Ends next day (overnight shift)</p>}</div>
          <div className="field" style={{ flex: 1 }}><label>Workers needed</label>
            <input className="input" type="number" min="1" max="500" value={form.workersNeeded} onChange={(e) => setForm({ ...form, workersNeeded: e.target.value })} />{fe('workersNeeded')}</div>
        </div>
        <div className="field"><label>Address line</label>
          <input className="input" value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
          {locating && <p className="muted">Locating…</p>}{fe('addressLine')}</div>
        <label>Pin the exact location</label>
        <div className="mt-8"><MapPicker value={pin} center={center} onChange={(lat, lng) => setPin({ lat, lng })} /></div>
        {pin.lat && <p className="muted mt-8">📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</p>}
        <button className="btn btn-primary btn-block mt-16" disabled={busy}>{busy ? 'Posting…' : 'Post job'}</button>
      </form>
    </div>
  );
}
