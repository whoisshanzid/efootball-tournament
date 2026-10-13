import { useEffect, useState } from 'react'

export default function PlayerForm({ initial = null, onSubmit, onCancel = null, submitting = false }) {
  const [name, setName] = useState('')
  const [team, setTeam] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    setName(initial?.name || '')
    setTeam(initial?.team || '')
    setActive(initial?.active ?? true)
  }, [initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), team: team.trim() || null, active })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-panel/60 p-5"
    >
      <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted">
        {initial ? 'Edit Player' : 'Add New Player'}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Name *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lionel Messi"
            required
            className="w-full rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pitch focus:ring-2 focus:ring-pitch/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Team / Club (optional)</span>
          <input
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="e.g. Inter Miami"
            className="w-full rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pitch focus:ring-2 focus:ring-pitch/20"
          />
        </label>
      </div>
      <div className="mt-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-panel-2 px-3.5 py-2.5">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-pitch"
          />
          <span className="text-sm font-medium text-ink">Active player</span>
          <span className="text-xs text-muted">
            Inactive players appear below active players in the point table.
          </span>
        </label>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-xl bg-pitch px-4 py-2.5 text-sm font-bold text-night transition-colors hover:bg-pitch-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving…' : initial ? 'Save Changes' : 'Add Player'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-line bg-panel-2 px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}