// Dialogo di conferma (azioni distruttive)

import { useEffect } from 'react'

interface Props {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Conferma', cancelLabel = 'Annulla',
  danger, loading, error, onConfirm, onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(340px, 100%)', background: 'var(--prox-surface)',
          borderRadius: 18, padding: '20px 18px 16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}
      >
        <div className="prox-display" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{title}</div>
        {message && (
          <p style={{ fontSize: 14, color: 'var(--prox-ink2)', lineHeight: 1.5, margin: '0 0 14px' }}>{message}</p>
        )}
        {error && (
          <p style={{ fontSize: 13, color: 'var(--prox-danger)', margin: '0 0 12px' }}>{error}</p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} disabled={loading} style={{
            flex: 1, padding: '12px 0', borderRadius: 999, cursor: 'pointer',
            background: 'var(--prox-surface2)', border: '1px solid var(--prox-line)',
            color: 'var(--prox-ink2)', fontSize: 15, fontWeight: 600,
          }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, padding: '12px 0', borderRadius: 999, cursor: 'pointer', border: 'none',
            background: danger ? 'var(--prox-danger)' : 'var(--prox-accent)',
            color: '#fff', fontSize: 15, fontWeight: 700, opacity: loading ? 0.6 : 1,
          }}>
            {loading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
