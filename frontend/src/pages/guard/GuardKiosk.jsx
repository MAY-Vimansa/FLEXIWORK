import { useRef, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';

function avatarUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `/api/files/${path}`;
}

// ── States: idle → scanning → preview → success | error ──────────────────────

export default function GuardKiosk() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const lastScanRef = useRef(0);

  const [phase, setPhase] = useState('idle'); // idle | scanning | preview | success | error
  const [preview, setPreview] = useState(null);
  const [pendingToken, setPendingToken] = useState('');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  // ── Camera ────────────────────────────────────────────────────────────────

  async function startCamera() {
    setPhase('scanning');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('gk-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        (token) => onQrDetected(token),
        () => {},
      );
    } catch {
      stopCamera();
      showError('Could not access the camera. Check permissions and try again.');
    }
  }

  function stopCamera() {
    const s = scannerRef.current;
    if (s) {
      s.stop().then(() => s.clear()).catch(() => {});
      scannerRef.current = null;
    }
  }

  // ── QR detected ──────────────────────────────────────────────────────────

  async function onQrDetected(token) {
    const now = Date.now();
    if (now - lastScanRef.current < 2000) return;
    lastScanRef.current = now;

    stopCamera();
    setPhase('preview');
    setPendingToken(token);

    try {
      const data = await api.get(`/api/attendance/preview/${encodeURIComponent(token)}`);
      setPreview(data);
    } catch (e) {
      showError(e.message || 'Invalid QR code.');
    }
  }

  // ── Confirm action ────────────────────────────────────────────────────────

  async function confirmAction() {
    if (!pendingToken || busy) return;
    setBusy(true);
    try {
      const res = await api.post('/api/attendance/scan', { token: pendingToken });
      setResult(res);
      setPhase('success');
    } catch (e) {
      showError(e.message || 'Check-in failed.');
    } finally {
      setBusy(false);
    }
  }

  function showError(msg) {
    setErrorMsg(msg);
    setPhase('error');
    stopCamera();
  }

  function reset() {
    setPhase('idle');
    setPreview(null);
    setPendingToken('');
    setResult(null);
    setErrorMsg('');
    setBusy(false);
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const S = {
    page: {
      minHeight: '100vh', background: '#F8F8F6',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: 'inherit',
    },
    header: {
      position: 'fixed', top: 0, left: 0, right: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px',
      background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #ECECEC', zIndex: 10,
    },
    logo: { fontWeight: 800, fontSize: 18, color: '#EB1700', letterSpacing: '-.3px' },
    logoutBtn: {
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 16px', borderRadius: 999,
      border: '1.5px solid #D4D4D4', background: '#fff',
      fontWeight: 600, fontSize: 14, color: '#1A1A1A',
      cursor: 'pointer', fontFamily: 'inherit',
    },
    card: {
      background: '#fff', borderRadius: 20,
      boxShadow: '0 4px 32px rgba(0,0,0,.08)',
      padding: '40px 36px', width: '100%', maxWidth: 420,
      textAlign: 'center',
    },
    scanBtn: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      width: '100%', padding: '16px 24px', borderRadius: 14,
      background: '#EB1700', color: '#fff', border: 'none',
      fontWeight: 700, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit',
      boxShadow: '0 6px 20px rgba(235,23,0,.30)',
      marginTop: 28,
    },
    cancelBtn: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: '100%', padding: '13px 24px', borderRadius: 14,
      background: '#fff', color: '#1A1A1A', border: '1.5px solid #D4D4D4',
      fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
      marginTop: 14,
    },
    avatar: {
      width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
      border: '3px solid #F3F3F1', margin: '0 auto 16px',
      display: 'block',
    },
    avatarFallback: {
      width: 80, height: 80, borderRadius: '50%',
      background: '#EB1700', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 28, fontWeight: 800, margin: '0 auto 16px',
    },
    workerName: { fontSize: 22, fontWeight: 800, color: '#1A1A1A', marginBottom: 4 },
    jobTitle: { fontSize: 15, color: '#5A5A5A', marginBottom: 6 },
    actionPill: (action) => ({
      display: 'inline-block',
      padding: '5px 16px', borderRadius: 999,
      fontWeight: 700, fontSize: 13,
      background: action === 'CHECK_IN' ? '#DCFCE7' : '#FEF3C7',
      color: action === 'CHECK_IN' ? '#15803D' : '#B45309',
      marginBottom: 24,
    }),
    confirmBtn: (action) => ({
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      width: '100%', padding: '16px 24px', borderRadius: 14,
      background: action === 'CHECK_IN' ? '#EB1700' : '#F59E0B',
      color: '#fff', border: 'none',
      fontWeight: 700, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit',
      boxShadow: action === 'CHECK_IN'
        ? '0 6px 20px rgba(235,23,0,.28)'
        : '0 6px 20px rgba(245,158,11,.28)',
      marginTop: 4,
    }),
    wage: { fontSize: 13, color: '#7A7A7A', marginBottom: 20 },
    successIcon: { fontSize: 56, marginBottom: 12 },
    successName: { fontSize: 22, fontWeight: 800, color: '#1A1A1A', marginBottom: 4 },
    successSub: { fontSize: 15, color: '#5A5A5A', marginBottom: 6 },
    errorIcon: { fontSize: 52, marginBottom: 12 },
    errorMsg: { fontSize: 15, color: '#5A5A5A', marginBottom: 28, lineHeight: 1.5 },
  };

  return (
    <>
      {/* Fixed header */}
      <div className="gk-header" style={S.header}>
        <span style={S.logo}>FlexiWork Guard</span>
        <button className="gk-logout-btn" style={S.logoutBtn} onClick={() => setConfirmingLogout(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log out
        </button>
        <ConfirmDialog
          open={confirmingLogout}
          title="Log out?"
          message="You'll need to log in again to use the scanner."
          confirmLabel="Log out"
          onConfirm={() => { setConfirmingLogout(false); logout(); navigate('/login'); }}
          onCancel={() => setConfirmingLogout(false)}
        />
      </div>

      <div className="gk-page" style={S.page}>

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <div className="gk-card" style={S.card}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>📷</div>
            <div className="gk-card-title" style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>
              Ready to Scan
            </div>
            <div className="gk-card-sub" style={{ fontSize: 15, color: '#7A7A7A', lineHeight: 1.6 }}>
              Ask the worker to show their QR code, then tap the button below to scan.
            </div>
            <button style={S.scanBtn} onClick={startCamera}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 7 23 1 17 1"/><line x1="16" y1="8" x2="23" y2="1"/>
                <polyline points="1 17 1 23 7 23"/><line x1="8" y1="16" x2="1" y2="23"/>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
              Scan QR Code
            </button>
          </div>
        )}

        {/* ── SCANNING ── */}
        {phase === 'scanning' && (
          <div className="gk-card" style={{ ...S.card, padding: '28px 24px' }}>
            <div className="gk-card-title" style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 16 }}>
              Point camera at the worker's QR code
            </div>
            <div id="gk-reader" style={{ borderRadius: 12, overflow: 'hidden' }} />
            <button className="gk-cancel-btn" style={S.cancelBtn} onClick={() => { stopCamera(); reset(); }}>
              Cancel
            </button>
          </div>
        )}

        {/* ── PREVIEW (loading) ── */}
        {phase === 'preview' && !preview && (
          <div className="gk-card" style={S.card}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <div className="gk-card-sub" style={{ fontSize: 16, color: '#7A7A7A' }}>Looking up worker…</div>
          </div>
        )}

        {/* ── PREVIEW (loaded) ── */}
        {phase === 'preview' && preview && (
          <div className="gk-card" style={S.card}>
            {avatarUrl(preview.profilePhotoPath)
              ? <img src={avatarUrl(preview.profilePhotoPath)} alt="" style={S.avatar} />
              : <div style={S.avatarFallback}>{preview.workerName?.[0]?.toUpperCase()}</div>
            }
            <div className="gk-worker-name" style={S.workerName}>{preview.workerName}</div>
            <div className="gk-job-title" style={S.jobTitle}>{preview.jobTitle}</div>
            <div>
              <span style={S.actionPill(preview.pendingAction)}>
                {preview.pendingAction === 'CHECK_IN' ? '→ Check In' : '→ Check Out'}
              </span>
            </div>
            <div className="gk-wage" style={S.wage}>
              Daily wage: LKR {Number(preview.baseWage).toLocaleString()}
            </div>
            <button
              style={{ ...S.confirmBtn(preview.pendingAction), opacity: busy ? .7 : 1 }}
              onClick={confirmAction}
              disabled={busy}
            >
              {busy ? 'Processing…' : preview.pendingAction === 'CHECK_IN' ? '✓ Check In' : '✓ Check Out'}
            </button>
            <button className="gk-cancel-btn" style={S.cancelBtn} onClick={reset}>
              Cancel
            </button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {phase === 'success' && result && (
          <div className="gk-card" style={S.card}>
            <div style={S.successIcon}>
              {result.action === 'CHECK_IN' ? '✅' : '🏁'}
            </div>
            <div className="gk-worker-name" style={S.successName}>{result.workerName}</div>
            <div className="gk-job-title" style={S.successSub}>{result.jobTitle}</div>
            <div style={{ marginBottom: 8 }}>
              <span style={S.actionPill(result.action)}>
                {result.action === 'CHECK_IN' ? '✓ Checked In' : '✓ Checked Out'}
              </span>
            </div>
            {result.action === 'CHECK_OUT' && (
              <div className="gk-wage" style={{ fontSize: 14, color: '#5A5A5A', marginBottom: 20 }}>
                Total pay: <strong>LKR {Number(result.totalPayable).toLocaleString()}</strong>
              </div>
            )}
            <button style={S.scanBtn} onClick={reset}>
              Scan Next Worker
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div className="gk-card" style={S.card}>
            <div style={S.errorIcon}>⚠️</div>
            <div className="gk-card-title" style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
              Scan Failed
            </div>
            <div className="gk-card-sub" style={S.errorMsg}>{errorMsg}</div>
            <button style={S.scanBtn} onClick={reset}>
              Try Again
            </button>
          </div>
        )}

      </div>
    </>
  );
}
