import { useEffect } from 'react'

export default function ConfirmModal({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, busy = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-2xl">
          🗑️
        </div>
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-line bg-panel-2 px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}