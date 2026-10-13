import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../api/client'
import StandingsTable from '../components/StandingsTable'
import MatchForm from '../components/MatchForm'
import ConfirmModal from '../components/ConfirmModal'
import { downloadStandingsCSV } from '../utils/csv'
import { useAuth } from '../context/AuthContext'

const QUALIFY_COUNT = 8

export default function Playoff() {
  const { isAuthenticated } = useAuth()
  const [standings, setStandings] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingMatch, setEditingMatch] = useState(null)
  const [deletingMatch, setDeletingMatch] = useState(null)
  const [busy, setBusy] = useState(false)
  const [createFormVersion, setCreateFormVersion] = useState(0)

  const loadData = useCallback(async () => {
    try {
      const [standingsRes, matchesRes] = await Promise.all([
        api.get('/standings/playoff'),
        api.get('/matches'),
      ])
      setStandings(standingsRes.data)
      setMatches(matchesRes.data.filter((m) => m.stage === 'PLAYOFF'))
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load playoffs'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const entrants = useMemo(
    () => standings.map((row) => ({ id: row.playerId, name: row.name, team: row.team })),
    [standings]
  )

  const qualified = useMemo(() => standings.filter((row) => row.qualified).length, [standings])

  const editingPlayers = useMemo(() => {
    if (!editingMatch) return entrants
    const ids = new Set([editingMatch.homeId, editingMatch.awayId].filter(Boolean))
    const extras = [editingMatch.home, editingMatch.away]
      .filter(Boolean)
      .filter((p) => !entrants.some((e) => e.id === p.id) && ids.has(p.id))
    return extras.length ? [...entrants, ...extras] : entrants
  }, [editingMatch, entrants])

  const handleDownload = () => {
    if (!standings.length) {
      toast.error('No playoff standings to export yet')
      return
    }
    downloadStandingsCSV(standings, 'playoff-point-table')
    toast.success('Playoff point table exported as CSV')
  }

  const handleSubmit = async (data, initial) => {
    setBusy(true)
    try {
      const payload = { ...data, stage: 'PLAYOFF', slot: 0 }
      if (initial) {
        await api.put(`/matches/${initial.id}`, payload)
        toast.success('Playoff match updated')
      } else {
        await api.post('/matches', payload)
        toast.success('Playoff match added')
        setCreateFormVersion((v) => v + 1)
      }
      setEditingMatch(null)
      await loadData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save match'))
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deletingMatch) return
    setBusy(true)
    try {
      await api.delete(`/matches/${deletingMatch.id}`)
      toast.success('Playoff match deleted')
      setDeletingMatch(null)
      if (editingMatch?.id === deletingMatch.id) setEditingMatch(null)
      await loadData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete match'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel via-panel/80 to-amber-500/10 p-6 sm:p-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
          Playoff Round
        </div>
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Playoffs</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          The 14 teams ranked <span className="font-semibold text-amber-300">9th to 22nd</span> in the
          point table play a league round. The <span className="font-semibold text-pitch">top 8</span>{' '}
          qualify for the Round of 16, joining the top 8 who advanced directly.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line/60 pt-4 text-xs">
          <span className="rounded-full border border-line bg-panel/70 px-3 py-1 font-semibold text-muted">
            {entrants.length} teams in playoff
          </span>
          <span className="rounded-full border border-pitch/30 bg-pitch/10 px-3 py-1 font-semibold text-pitch">
            {qualified} / {QUALIFY_COUNT} qualified
          </span>
          <span className="rounded-full border border-line bg-panel/70 px-3 py-1 font-semibold text-muted">
            {matches.length} matches played/added
          </span>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Playoff Standings</h2>
          <button
            onClick={handleDownload}
            disabled={loading || !standings.length}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pitch to-pitch-dark px-4 py-2.5 text-sm font-bold text-night shadow-lg shadow-pitch/20 transition-all hover:shadow-pitch/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0 0l-4-4m4 4l4-4" />
            </svg>
            Download CSV
          </button>
        </div>
        <StandingsTable
          standings={standings}
          loading={loading}
          title="Playoff Table"
          qualifyCount={QUALIFY_COUNT}
          emptyTitle="No playoff teams yet"
          emptyMessage="Playoff teams appear once the group-stage point table has more than 8 ranked players."
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">Playoff Matches</h2>
          {isAuthenticated && (
            <span className="text-xs text-muted">Admin: add and record playoff results below</span>
          )}
        </div>

        {isAuthenticated && entrants.length > 0 && (
          <MatchForm
            key={`create-${createFormVersion}`}
            players={entrants}
            onSubmit={(data) => handleSubmit(data, null)}
            submitting={busy}
          />
        )}

        <div className="overflow-hidden rounded-2xl border border-line bg-panel/60">
          {loading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-panel-2" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              No playoff matches yet.
              {isAuthenticated ? ' Create one above.' : ''}
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {matches.map((m) => {
                const played = m.played && m.homeScore != null && m.awayScore != null

                if (editingMatch?.id === m.id) {
                  return (
                    <li key={m.id} className="p-4 sm:p-5">
                      <MatchForm
                        players={editingPlayers}
                        initial={m}
                        onSubmit={(data) => handleSubmit(data, m)}
                        onCancel={() => setEditingMatch(null)}
                        submitting={busy}
                      />
                    </li>
                  )
                }

                return (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-panel-2/40 sm:flex-nowrap"
                  >
                    <span className="shrink-0 rounded-md border border-line bg-panel-2 px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted">
                      #{m.id}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="max-w-[150px] truncate font-semibold text-ink">{m.home.name}</span>
                      <span className="shrink-0 rounded-lg border border-line bg-panel-2 px-2.5 py-1 text-sm font-black tracking-wider text-ink">
                        {played ? `${m.homeScore} - ${m.awayScore}` : 'vs'}
                      </span>
                      <span className="max-w-[150px] truncate font-semibold text-ink">{m.away.name}</span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        played ? 'bg-pitch/15 text-pitch' : 'bg-panel-2 text-muted'
                      }`}
                    >
                      {played ? 'Played' : 'Upcoming'}
                    </span>
                    {isAuthenticated && (
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => setEditingMatch(m)}
                          className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-pitch"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingMatch(m)}
                          className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <ConfirmModal
        open={Boolean(deletingMatch)}
        title="Delete playoff match?"
        message={`${deletingMatch?.home?.name} vs ${deletingMatch?.away?.name} will be permanently deleted.`}
        confirmLabel="Delete Match"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingMatch(null)}
        busy={busy}
      />
    </div>
  )
}
