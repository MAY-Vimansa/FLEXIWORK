import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import '../home.css';

import logoBrandix from '../assets/logos/brandix.png';
import logoMas from '../assets/logos/mas.png';
import logoHayleys from '../assets/logos/hayleys.png';
import logoJkh from '../assets/logos/jkh.png';
import logoCargills from '../assets/logos/cargills.png';
import logoDialog from '../assets/logos/dialog.png';
import logoHemas from '../assets/logos/hemas.png';
import logoAitken from '../assets/logos/aitken.png';
import logoCombank from '../assets/logos/combank.png';
import logoExpolanka from '../assets/logos/expolanka.png';
import logoSampath from '../assets/logos/sampath.png';
import logoSrilankan from '../assets/logos/srilankan.png';

// Category -> badge class + readable label (matches the design's coloured badges).
const BADGE = {
  RESTAURANT_KITCHEN: ['b-restaurant', 'Restaurant'],
  HOTEL: ['b-hotel', 'Hotel'],
  FACTORY: ['b-factory', 'Factory'],
  CONSTRUCTION: ['b-other', 'Construction'],
  EVENT_CAMPAIGN: ['b-marketing', 'Marketing'],
  CLEANING: ['b-retail', 'Cleaning'],
  WAREHOUSE: ['b-other', 'Warehouse'],
  DELIVERY: ['b-retail', 'Delivery'],
  AGRICULTURE: ['b-retail', 'Agriculture'],
  OTHER: ['b-other', 'Other'],
};

const LOGOS = [
  { src: logoBrandix, name: 'Brandix' },
  { src: logoMas, name: 'MAS Holdings' },
  { src: logoHayleys, name: 'Hayleys' },
  { src: logoJkh, name: 'John Keells' },
  { src: logoCargills, name: 'Cargills' },
  { src: logoDialog, name: 'Dialog' },
  { src: logoHemas, name: 'Hemas' },
  { src: logoAitken, name: 'Aitken Spence' },
  { src: logoCombank, name: 'Commercial Bank' },
  { src: logoExpolanka, name: 'Expolanka' },
  { src: logoSampath, name: 'Sampath Bank' },
  { src: logoSrilankan, name: 'SriLankan Airlines' },
];

export default function JobFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refData, setRefData] = useState({ districts: [], categories: [] });
  const [filters, setFilters] = useState({ district: '', category: '', minWage: '', keyword: '', sort: 'newest' });
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/api/reference/districts'), api.get('/api/reference/categories')])
      .then(([districts, categories]) => setRefData({ districts, categories }))
      .catch(() => {});
  }, []);

  function loadJobs(silent) {
    if (!silent) setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', page); params.set('size', '9');
    api.get(`/api/jobs?${params.toString()}`)
      .then((d) => setData(d))
      .catch(() => { if (!silent) setData({ content: [], totalElements: 0, totalPages: 0, first: true, last: true }); })
      .finally(() => { if (!silent) setLoading(false); });
  }

  useEffect(() => {
    loadJobs(false);
    const id = setInterval(() => loadJobs(true), 20_000);
    return () => clearInterval(id);
  }, [filters, page]);

  function setFilter(key, value) { setPage(0); setFilters((f) => ({ ...f, [key]: value })); }
  function clearAll() { setPage(0); setFilters({ district: '', category: '', minWage: '', keyword: '', sort: 'newest' }); }

  const total = data?.totalElements ?? 0;

  function apply(e, jobId) {
    e.preventDefault();
    if (!user) navigate('/login', { state: { from: `/jobs/${jobId}` } });
    else navigate(`/jobs/${jobId}`);
  }

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow"><span className="dot" /> {total} active jobs right now</span>
          <h1>Find Daily Work.<br /><span className="ghost">Get Paid Today.</span></h1>
          <p className="sub">Next-day temporary jobs from verified companies across all 25 districts of Sri Lanka.</p>
          <div className="stats">
            <div><div className="num">{total}</div><div className="lbl">Active Jobs</div></div>
            <div><div className="num">{refData.districts.length || 25}</div><div className="lbl">Districts</div></div>
            <div><div className="num">10%</div><div className="lbl">Flat Commission</div></div>
          </div>
        </div>
      </section>

      <div className="body-wrap">
        <div className="container">
          {/* Filter bar */}
          <div className="filter-bar">
            <div className="fb-field">
              <label>Search</label>
              <input placeholder="Job title or keyword…" value={filters.keyword}
                onChange={(e) => setFilter('keyword', e.target.value)} />
            </div>
            <div className="fb-field">
              <label>District</label>
              <select value={filters.district} onChange={(e) => setFilter('district', e.target.value)}>
                <option value="">All Districts</option>
                {refData.districts.map((d) => <option key={d.name} value={d.name}>{d.name.replaceAll('_', ' ')}</option>)}
              </select>
            </div>
            <div className="fb-field">
              <label>Category</label>
              <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
                <option value="">All Categories</option>
                {refData.categories.map((c) => <option key={c} value={c}>{c.replaceAll('_', ' ')}</option>)}
              </select>
            </div>
            <div className="fb-field">
              <label>Min wage (LKR)</label>
              <input type="number" placeholder="e.g. 3000" value={filters.minWage}
                onChange={(e) => setFilter('minWage', e.target.value)} />
            </div>
            <div className="filter-actions">
              <button className="btn-ghost" onClick={clearAll}>Clear</button>
            </div>
          </div>

          {/* Stat strip */}
          <div className="stat-strip">
            <div className="ss-item"><div className="ss-num">{total}</div><div className="ss-lbl">Open Jobs</div></div>
            <div className="ss-item"><div className="ss-num">25</div><div className="ss-lbl">Districts Covered</div></div>
            <div className="ss-item"><div className="ss-num">10</div><div className="ss-lbl">Job Categories</div></div>
            <div className="ss-item"><div className="ss-num">24h</div><div className="ss-lbl">Next-day Hiring</div></div>
          </div>

          {/* Results */}
          <div className="results-head">
            <h2>Available jobs</h2>
            <span className="count-pill">{total} found</span>
            <span className="sort-label">
              Sorted by{' '}
              <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--ink)' }}>
                <option value="newest">Newest</option>
                <option value="wage">Highest wage</option>
                <option value="date">Soonest date</option>
              </select>
            </span>
          </div>

          <div className="grid">
            {loading && [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="jc skeleton" style={{ height: 320 }} />)}

            {!loading && data?.content?.length === 0 && (
              <div className="empty2">
                <div className="big">No jobs match your filters</div>
                <div>Try widening the wage range or clearing filters.</div>
                <button className="btn-primary" style={{ marginTop: 18 }} onClick={clearAll}>Clear filters</button>
              </div>
            )}

            {!loading && data?.content?.map((job) => {
              const [badgeClass, badgeLabel] = BADGE[job.category] || BADGE.OTHER;
              const low = job.slotsLeft <= 2 && job.slotsLeft > 0;
              return (
                <div key={job.id} className="jc" role="link" tabIndex={0}
                  onClick={() => navigate(`/jobs/${job.id}`)}>
                  <div className="card-top">
                    <span className={`badge2 ${badgeClass}`}>{badgeLabel}</span>
                    <div className="wage">
                      <div className="amt">LKR {Number(job.dailyWage).toLocaleString()}</div>
                      <div className="per">per day</div>
                    </div>
                  </div>
                  <h3>{job.title}</h3>
                  <div className="co-row">
                    <span className="co">{job.companyName}</span>
                    {job.mapsLink && (
                      <a className="map-btn" href={job.mapsLink} target="_blank" rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}>📍 Map</a>
                    )}
                  </div>
                  <p className="desc">{job.description}</p>
                  <div className="meta">
                    <span className="mrow">🗓 {job.jobDate}</span>
                    <span className="mrow">⏰ {job.startTime?.slice(0, 5)}–{job.endTime?.slice(0, 5)}</span>
                    <span className="mrow">📍 {job.district?.replaceAll('_', ' ')}</span>
                    <span className={`mrow ${low ? 'slots-low2' : ''}`}>👥 {job.slotsLeft}/{job.workersNeeded} left</span>
                  </div>
                  <div className="chips2">
                    {job.distanceKm != null && <span className="chip2">{job.distanceKm} km away</span>}
                    <span className="chip2">{job.addressLine}</span>
                  </div>
                  <button className="apply" onClick={(e) => { e.stopPropagation(); apply(e, job.id); }}>
                    {user ? 'View & Apply' : 'Log in to Apply'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="pager">
              <button className="btn-ghost" disabled={data.first} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="muted">Page {data.page + 1} of {data.totalPages}</span>
              <button className="btn-ghost" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>

      {/* Partner marquee */}
      <section className="marquee-sec">
        <div className="marquee-head">Trusted by leading Sri Lankan companies</div>
        <div className="marquee">
          <div className="marquee-track">
            {[...LOGOS, ...LOGOS].map((logo, i) => (
              <img key={i} src={logo.src} alt={logo.name} className="m-logo-img" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
