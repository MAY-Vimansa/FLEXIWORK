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

  function setWorkers(n) {
    const clamped = Math.max(1, Math.min(500, n));
    setForm((f) => ({ ...f, workersNeeded: clamped }));
  }

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

  // ── Live-preview derived display values (presentational only) ──
  const wagePreview = (() => {
    const n = parseInt(form.dailyWage, 10);
    return form.dailyWage && !Number.isNaN(n) ? n.toLocaleString('en-US') : '—';
  })();
  const datePreview = (() => {
    if (!form.jobDate) return 'Pick a date';
    const dt = new Date(form.jobDate + 'T00:00:00');
    return Number.isNaN(dt.getTime()) ? form.jobDate : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  })();
  const categoryLabel = form.category ? form.category.replaceAll('_', ' ') : 'Category';
  const districtLabel = form.district ? form.district.replaceAll('_', ' ') : 'District';
  const hoursPreview = `${form.startTime || '—'} – ${form.endTime || '—'}`;

  return (
      <div className="page pj">
        <div className="pj-head">
          <h1 className="pj-title">Post a job<span className="pj-dot">.</span></h1>
          <p className="pj-subtitle">Fill in the details — your listing previews on the right as you type.</p>
        </div>

        {err && <div className="form-error mt-16">{err}</div>}

        <form className="pj-grid" onSubmit={submit}>
          {/* ── Left: form ── */}
          <div className="pj-card">
            <div className="pj-eyebrow">The basics</div>

            <div className="pj-field">
              <label className="pj-label">Title</label>
              <input className="pj-input" required maxLength={120} placeholder="e.g. Delivery Loader"
                     value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              {fe('title')}
            </div>

            <div className="pj-field">
              <label className="pj-label">Description</label>
              <textarea className="pj-input pj-textarea" required maxLength={2000} rows={3}
                        placeholder="Describe the work, requirements, and what to bring."
                        value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              {fe('description')}
            </div>

            <div className="pj-row2">
              <div className="pj-field">
                <label className="pj-label">Category</label>
                <select className="pj-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select…</option>
                  {categories.map((c) => <option key={c} value={c}>{c.replaceAll('_', ' ')}</option>)}
                </select>
                {fe('category')}
              </div>
              <div className="pj-field">
                <label className="pj-label">District</label>
                <select className="pj-input" value={form.district} onChange={(e) => onDistrict(e.target.value)}>
                  <option value="">Select…</option>
                  {districts.map((d) => <option key={d.name} value={d.name}>{d.name.replaceAll('_', ' ')}</option>)}
                </select>
                {fe('district')}
              </div>
            </div>

            <div className="pj-divider" />
            <div className="pj-eyebrow">Schedule &amp; pay</div>

            <div className="pj-row2">
              <div className="pj-field">
                <label className="pj-label">Date</label>
                <input className="pj-input" type="date" required min={new Date().toISOString().slice(0, 10)}
                       value={form.jobDate} onChange={(e) => setForm({ ...form, jobDate: e.target.value })} />
                {fe('jobDate')}
              </div>
              <div className="pj-field">
                <label className="pj-label">Daily wage · LKR</label>
                <input className="pj-input" type="number" min="0.01" step="0.01" placeholder="2,700"
                       value={form.dailyWage} onChange={(e) => setForm({ ...form, dailyWage: e.target.value })} />
                {fe('dailyWage')}
              </div>
            </div>

            <div className="pj-row3">
              <div className="pj-field">
                <label className="pj-label">Start</label>
                <input className="pj-input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="pj-field">
                <label className="pj-label">End</label>
                <input className="pj-input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                {form.endTime && form.startTime && form.endTime <= form.startTime &&
                    <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Ends next day (overnight shift)</p>}
              </div>
              <div className="pj-field">
                <label className="pj-label">Workers</label>
                <div className="pj-stepper">
                  <button type="button" className="pj-step pj-step-minus" onClick={() => setWorkers(Number(form.workersNeeded) - 1)} aria-label="Fewer workers">−</button>
                  <span className="pj-step-val">{form.workersNeeded}</span>
                  <button type="button" className="pj-step pj-step-plus" onClick={() => setWorkers(Number(form.workersNeeded) + 1)} aria-label="More workers">+</button>
                </div>
                {fe('workersNeeded')}
              </div>
            </div>

            <div className="pj-divider" />
            <div className="pj-eyebrow">Location</div>

            <div className="pj-field">
              <label className="pj-label">Address line</label>
              <input className="pj-input" placeholder="88 Puttalam Road, Kurunegala"
                     value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
              {locating && <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Locating…</p>}
              {fe('addressLine')}
            </div>

            <div className="pj-map">
              <MapPicker value={pin} center={center} onChange={(lat, lng) => setPin({ lat, lng })} />
            </div>
            {pin.lat && <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</p>}
          </div>

          {/* ── Right: live preview ── */}
          <div className="pj-preview">
            <div className="pj-preview-bar">Live preview</div>
            <div className="pj-preview-body">
              <div className={`pj-preview-title ${form.title ? '' : 'is-empty'}`}>{form.title || 'Your job title'}</div>

              <div className="pj-chips">
                <span className="pj-chip pj-chip-red">{categoryLabel}</span>
                <span className="pj-chip pj-chip-gray">{districtLabel}</span>
              </div>

              <div className="pj-divider" />

              <div className="pj-figures">
                <div>
                  <div className="pj-fig-label">Daily wage · LKR</div>
                  <div className="pj-fig-value pj-fig-red">{wagePreview}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="pj-fig-label">Workers</div>
                  <div className="pj-fig-value">{form.workersNeeded}</div>
                </div>
              </div>

              <div className="pj-detail-rows">
                <div className="pj-detail"><span>Date</span><span className="pj-detail-val">{datePreview}</span></div>
                <div className="pj-detail"><span>Hours</span><span className="pj-detail-val">{hoursPreview}</span></div>
                <div className="pj-detail"><span>Address</span><span className="pj-detail-val pj-detail-addr">{form.addressLine || 'Not set'}</span></div>
              </div>

              <button className="pj-submit" disabled={busy}>{busy ? 'Posting…' : 'Post job'}</button>
            </div>
          </div>
        </form>
      </div>
  );
}
