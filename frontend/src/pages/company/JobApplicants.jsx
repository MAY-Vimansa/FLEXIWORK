import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api';

// Read-only view of applicants for one job — acceptance is automatic (verified workers are
// accepted instantly on apply; unverified ones once their KYC auto-verifies), so there's nothing
// for the company to action here.
export default function JobApplicants() {
  const { id } = useParams();
  const [applicants, setApplicants] = useState(null);

  useEffect(() => {
    api.get(`/api/applications/job/${id}`).then(setApplicants).catch(() => setApplicants([]));
  }, [id]);

  if (!applicants) return <div className="page"><div className="skeleton skel-card" /></div>;

  return (
    <div className="page">
      <Link to="/company/jobs" className="muted">← Back to jobs</Link>
      <h1 className="mt-8">Applicants</h1>
      <p className="muted">Verified workers are accepted automatically when they apply; unverified
        workers are accepted once their account verifies (within 12 hours).</p>
      {applicants.length === 0 && (
        <div className="empty">
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          <div>No applicants yet — check back once workers start applying.</div>
        </div>
      )}
      {applicants.map((a) => (
        <div key={a.applicationId} className="card">
          <div className="row between">
            <div className="row">
              <div className="logo">
                {a.profilePhotoPath
                  ? <img src={`/api/files/${a.profilePhotoPath}`} alt="" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
                  : a.workerName?.[0]}
              </div>
              <div>
                <h3>{a.workerName}</h3>
                <div className="job-meta">{a.workerDistrict} · ⭐ {a.rating} · {a.skills || 'No skills listed'}</div>
              </div>
            </div>
            <span className={`badge ${a.status}`}>{a.status === 'PENDING' ? 'Awaiting verification' : a.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
