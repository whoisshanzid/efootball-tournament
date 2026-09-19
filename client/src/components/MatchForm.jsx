import { useEffect, useState } from 'react'

export default function MatchForm({ players, initial = null, onSubmit, onCancel = null, submitting = false }) {
  const [homeId, setHomeId] = useState('')
  const [awayId, setAwayId] = useState('')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [played, setPlayed] = useState(false)

  useEffect(() => {
    setHomeId(initial?.homeId || '')
    setAwayId(initial?.awayId || '')
    setHomeScore(initial?.homeScore ?? '')
    setAwayScore(initial?.awayScore ?? '')
    setPlayed(Boolean(initial?.played))
  }, [initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!homeId || !awayId || homeId === awayId) return
    if (played && (homeScore === '' || awayScore === '')) return
    onSubmit({
      homeId: Number(homeId),
      awayId: Number(awayId),
      homeScore: played ? Number(homeScore) : null,
      awayScore: played ? Number(awayScore) : null,
      played,
    })
  }

  const selectClass =
    'w-full rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-pitch focus:ring-2 focus:ring-pitch/20'

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-panel/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted">
          {initial ? 'Edit Match' : 'Create Match'}
        </h3>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-panel-2 px-3 py-1.5">
          <input
            type="checkbox"
            checked={played}
            onChange={(e) => setPlayed(e.target.checked)}
            className="h-4 w-4 accent-pitch"
          />
          <span className="text-xs font-semibold text-muted">Played</span>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Home Player</span>
          <select
            value={homeId}
            onChange={(e) => setHomeId(e.target.value)}
            className={selectClass}
          >
            <option value="">Select home player…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={String(p.id) === String(awayId)}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Away Player</span>
          <select
            value={awayId}
            onChange={(e) => setAwayId(e.target.value)}
            className={selectClass}
          >
            <option value="">Select away player…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={String(p.id) === String(homeId)}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {played && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Home Score</span>
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              placeholder="0"
              className={selectClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Away Score</span>
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              placeholder="0"
              className={selectClass}
            />
          </label>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={submitting || !homeId || !awayId || homeId === awayId || (played && (homeScore === '' || awayScore === ''))}
          className="rounded-xl bg-pitch px-4 py-2.5 text-sm font-bold text-night transition-colors hover:bg-pitch-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving…' : initial ? 'Save Changes' : 'Create Match'}
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