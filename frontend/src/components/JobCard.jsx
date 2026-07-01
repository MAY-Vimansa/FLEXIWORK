import { Link } from 'react-router-dom';

// DoorDash-style job card: logo, title, muted meta, prominent wage, slots-left highlight.
export default function JobCard({ job }) {
  const low = job.slotsLeft <= 2 && job.slotsLeft > 0;
  return (
    <Link to={`/jobs/${job.id}`} className="card job-card">
      <div className="job-head">
        <div className="logo">
          {job.companyLogoPath
            ? <img src={`/api/files/${job.companyLogoPath}`} alt="" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
            : (job.companyName?.[0] || 'F')}
        </div>
        <div>
          <h3>{job.title}</h3>
          <div className="job-meta">{job.companyName} · {job.category?.replaceAll('_', ' ')}</div>
        </div>
      </div>
      <div className="job-meta mt-8">
        📍 {job.addressLine}, {job.district}
        {job.distanceKm != null && <> · {job.distanceKm} km away</>}
      </div>
      <div className="job-meta">🗓 {job.jobDate} · {job.startTime?.slice(0, 5)}–{job.endTime?.slice(0, 5)}</div>
      <div className="job-foot">
        <span className={low ? 'slots-low' : 'muted'} style={{ fontSize: 13, fontWeight: 600 }}>
          {job.slotsLeft} of {job.workersNeeded} slots left
        </span>
        <span className="price">LKR {Math.round(Number(job.dailyWage)).toLocaleString()}</span>
      </div>
    </Link>
  );
}
