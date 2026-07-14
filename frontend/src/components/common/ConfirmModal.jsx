// GO-LIVE-6 M4 — modale de confirmation applicative (remplace window.confirm natif).
export default function ConfirmModal({
  open, title, message,
  confirmLabel = 'Confirmer', cancelLabel = 'Annuler',
  danger = false, loading = false, onConfirm, onCancel,
}) {
  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 12, maxWidth: 460, width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
      >
        <div style={{ padding: '18px 20px 0' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: danger ? '#b91c1c' : '#111827' }}>{title}</h2>
        </div>
        <div style={{ padding: '12px 20px 4px', color: '#374151', fontSize: 14, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 16 }}>
          <button className="fdp-btn fdp-btn-secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
          <button
            className="fdp-btn fdp-btn-primary"
            onClick={onConfirm}
            disabled={loading}
            style={danger ? { background: '#dc2626', borderColor: '#dc2626' } : undefined}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
