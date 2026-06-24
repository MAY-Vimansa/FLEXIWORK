// Minimal confirm modal used for irreversible actions like logout.
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ borderRadius: 16, padding: 26, width: '100%', maxWidth: 360, boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{title}</h3>
        <p className="muted" style={{ margin: '0 0 22px', fontSize: 14, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
