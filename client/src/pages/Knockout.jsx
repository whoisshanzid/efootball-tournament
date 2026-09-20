import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../api/client'
import PlayerSelect from '../components/PlayerSelect'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import { TOURNAMENT_NAME } from '../config'

const ROUNDS = [
  { stage: 'R16', label: 'Round of 16', count: 8 },
  { stage: 'QF', label: 'Quarter-finals', count: 4 },
  { stage: 'SF', label: 'Semi-finals', count: 2 },
  { stage: 'F', label: 'Final', count: 1 },
]

const FEEDER = { QF: 'R16', SF: 'QF', F: 'SF' }

const CARD_GRID = {
  R16: (slot) => ({ rowS: 1 + slot, rowE: 2 + slot, colS: 1, colE: 2 }),
  QF: (slot) => ({ rowS: 2 * slot, rowE: 2 * slot + 2, colS: 3, colE: 4 }),
  SF: (slot) => ({ rowS: 4 * slot - 2, rowE: 4 * slot + 2, colS: 5, colE: 6 }),
  F: () => ({ rowS: 2, rowE: 10, colS: 7, colE: 8 }),
}

const CONNECTORS = [
  { stage: 'QF', colS: 2, colE: 3, count: 4 },
  { stage: 'SF', colS: 4, colE: 5, count: 2 },
  { stage: 'F', colS: 6, colE: 7, count: 1 },
]

const slotTag = (stage, slot) =>
  stage === 'R16' ? `Match ${slot}` : stage === 'QF' ? `QF${slot}` : stage === 'SF' ? `SF${slot}` : 'Final'

function winnerOf(m) {
  if (!m || !m.played || m.homeScore == null || m.awayScore == null) return null
  if (m.homeScore > m.awayScore) return m.home
  if (m.awayScore > m.homeScore) return m.away
  return null
}

function TeamRow({ player, score, winner, champion }) {
  const chip = champion
    ? 'bg-gold text-night'
    : winner
      ? 'bg-pitch text-night'
      : score != null
        ? 'bg-panel-2 text-muted'
        : ''

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors ${
        player ? (champion ? 'bg-gold/10' : winner ? 'bg-pitch/10' : 'hover:bg-panel-2/60') : ''
      }`}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {player ? (
          <>
            <Link
              to={`/player/${player.id}`}
              className="truncate text-xs font-semibold text-ink underline-offset-2 hover:text-pitch hover:underline"
            >
              {player.name}
            </Link>
            {(winner || champion) && <span className="shrink-0 text-pitch">✓</span>}
            {champion && <span className="shrink-0 text-gold">🏆</span>}
          </>
        ) : (
          <span className="truncate text-xs italic text-muted/50">TBD</span>
        )}
      </span>
      {score != null && (
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums ${chip}`}>
          {score}
        </span>
      )}
    </div>
  )
}

function SlotCard({ stage, slot, match, homePlayer, awayPlayer, isLive, isAdmin, onOpen }) {
  const champion = stage === 'F' ? winnerOf(match) : null
  const decided =
    match && match.played && match.homeScore != null && match.awayScore != null
  const homeWon = decided && match.homeScore > match.awayScore
  const awayWon = decided && match.awayScore > match.homeScore

  const displayHome = match ? match.home : homePlayer
  const displayAway = match ? match.away : awayPlayer
  const homeScore = match?.homeScore ?? null
  const awayScore = match?.awayScore ?? null

  return (
    <button
      type="button"
      disabled={!isAdmin}
      onClick={() => onOpen(stage, slot)}
      className={`group w-full rounded-xl border text-left transition-all ${
        stage === 'F'
          ? 'border-gold/40 bg-gold/5 shadow-lg shadow-gold/10'
          : 'border-line bg-panel/70 shadow-sm shadow-black/10'
      } ${
        isAdmin
          ? 'cursor-pointer hover:-translate-y-0.5 hover:border-pitch/50 hover:shadow-md'
          : 'cursor-default'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b px-2.5 py-1 ${
          stage === 'F' ? 'border-gold/20' : 'border-line/50'
        }`}
      >
        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted">
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-pitch" />}
          <span className={isLive ? 'text-pitch' : ''}>{slotTag(stage, slot)}</span>
        </span>
        {isAdmin && (
          <span className="rounded bg-night/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted opacity-0 transition-opacity group-hover:opacity-100">
            {match ? 'Edit' : 'Set'}
          </span>
        )}
      </div>
      <div className="divide-y divide-dashed divide-line/40 px-1.5 py-1.5">
        <TeamRow
          player={displayHome}
          score={homeScore}
          winner={homeWon}
          champion={champion?.id === match?.homeId}
        />
        <TeamRow
          player={displayAway}
          score={awayScore}
          winner={awayWon}
          champion={champion?.id === match?.awayId}
        />
      </div>
    </button>
  )
}

export default function Knockout() {
  const { isAuthenticated } = useAuth()
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [homeId, setHomeId] = useState('')
  const [awayId, setAwayId] = useState('')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [playersRes, matchesRes] = await Promise.all([api.get('/players'), api.get('/matches')])
      setPlayers(playersRes.data)
      setMatches(matchesRes.data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load knockout'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const grouped = useMemo(() => {
    const map = {}
    for (const m of matches) {
      if (m.stage && m.stage !== 'GROUP') map[`${m.stage}-${m.slot}`] = m
    }
    return map
  }, [matches])

  const stageMatch = (stage, slot) => grouped[`${stage}-${slot}`] || null

  const feederCandidates = (stage, slot) => {
    const prev = FEEDER[stage]
    if (!prev) return { home: null, away: null }
    return {
      home: winnerOf(stageMatch(prev, slot * 2 - 1)),
      away: winnerOf(stageMatch(prev, slot * 2)),
    }
  }

  const openEditor = (stage, slot) => {
    if (!isAuthenticated) return
    const stored = stageMatch(stage, slot)
    const cand = feederCandidates(stage, slot)
    setHomeId(String(stored?.homeId ?? cand.home?.id ?? ''))
    setAwayId(String(stored?.awayId ?? cand.away?.id ?? ''))
    setHomeScore(stored?.homeScore != null ? String(stored.homeScore) : '')
    setAwayScore(stored?.awayScore != null ? String(stored.awayScore) : '')
    setEditor({ stage, slot, match: stored || null })
  }

  const closeEditor = () => {
    setEditor(null)
    setHomeId('')
    setAwayId('')
    setHomeScore('')
    setAwayScore('')
  }

  const saveMatch = async () => {
    if (!editor) return
    if (!homeId || !awayId) {
      toast.error('Both players must be selected')
      return
    }
    if (homeId === awayId) {
      toast.error('A player cannot play against themselves')
      return
    }
    if (homeScore === '' || awayScore === '') {
      toast.error('Enter scores for: ' + editor.stage)
      return
    }
    if (Number(homeScore) === Number(awayScore)) {
      toast.error('Knockout matches cannot end in a draw')
      return
    }

    setBusy(true)
    try {
      const payload = {
        homeId: Number(homeId),
        awayId: Number(awayId),
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        played: true,
        stage: editor.stage,
        slot: editor.slot,
      }
      if (editor.match) {
        await api.put(`/matches/${editor.match.id}`, payload)
        toast.success('Match updated')
      } else {
        await api.post('/matches', payload)
        toast.success('Match recorded')
      }
      closeEditor()
      await loadData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save match'))
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await api.delete(`/matches/${deleting.id}`)
      toast.success('Knockout match deleted')
      setDeleting(null)
      closeEditor()
      await loadData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete match'))
    } finally {
      setBusy(false)
    }
  }

  const stageLabel = (stage) => ROUNDS.find((r) => r.stage === stage)?.label || stage

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel via-panel/80 to-gold/10 p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
              Super 16<span className="text-muted"> · </span>
              <span className="bg-gradient-to-r from-pitch to-gold bg-clip-text text-transparent">
                Knockout Stage
              </span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              {TOURNAMENT_NAME} — Round of 16 to the Final. Winners advance automatically.
            </p>
          </div>
          {isAuthenticated ? (
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-pitch/30 bg-pitch/10 px-3 py-1.5 text-xs font-bold text-pitch sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-pitch" />
              Admin mode — click any slot to set / edit its match
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-muted sm:self-auto">
              Viewing as guest — {!loading && matches.some((m) => m.stage && m.stage !== 'GROUP') ? 'live results' : 'empty brackets'}
            </span>
          )}
        </div>
      </section>

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-panel/60 p-6">
          <div className="h-64 animate-pulse rounded-xl bg-panel-2" />
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-line bg-panel/40">
          <div className="overflow-x-auto py-2">
            <div
              className="grid min-w-[680px] gap-x-0 gap-y-0 p-5 sm:p-7"
              style={{
                gridTemplateColumns:
                  'minmax(140px, 1fr) 36px minmax(140px, 1fr) 36px minmax(140px, 1fr) 36px minmax(150px, 1fr)',
                gridTemplateRows: '2rem repeat(8, 88px)',
              }}
            >
              {ROUNDS.map((round) => {
                const header = {
                  R16: { colS: 1, colE: 2 },
                  QF: { colS: 3, colE: 4 },
                  SF: { colS: 5, colE: 6 },
                  F: { colS: 7, colE: 8 },
                }[round.stage]
                return (
                  <div
                    key={`h-${round.stage}`}
                    className="flex items-center justify-center"
                    style={{ gridRow: 1, gridColumnStart: header.colS, gridColumnEnd: header.colE }}
                  >
                    <span className="rounded-full bg-panel-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted">
                      {round.label}
                    </span>
                  </div>
                )
              })}

              {ROUNDS.map((round) =>
                Array.from({ length: round.count }, (_, i) => i + 1).map((slot) => {
                  const m = stageMatch(round.stage, slot)
                  const cand = feederCandidates(round.stage, slot)
                  const storedWinner = winnerOf(m)
                  const isLive = Boolean(storedWinner)
                  const { rowS, rowE, colS, colE } = CARD_GRID[round.stage](slot)

                  return (
                    <div
                      key={`${round.stage}-${slot}`}
                      className="flex items-center"
                      style={{ gridColumnStart: colS, gridColumnEnd: colE, gridRowStart: rowS, gridRowEnd: rowE }}
                    >
                      <SlotCard
                        stage={round.stage}
                        slot={slot}
                        match={m}
                        homePlayer={cand.home}
                        awayPlayer={cand.away}
                        isLive={isLive}
                        isAdmin={isAuthenticated}
                        onOpen={openEditor}
                      />
                    </div>
                  )
                }),
              )}

              {CONNECTORS.map((gap) =>
                Array.from({ length: gap.count }, (_, i) => i + 1).map((slot) => {
                  const { rowS, rowE } = CARD_GRID[gap.stage](slot)
                  return (
                    <div
                      key={`c-${gap.stage}-${slot}`}
                      className="relative"
                      style={{ gridColumnStart: gap.colS, gridColumnEnd: gap.colE, gridRowStart: rowS, gridRowEnd: rowE }}
                    >
                      <span className="absolute left-0 top-1/4 h-px w-1/2 bg-line/60" />
                      <span className="absolute left-0 top-3/4 h-px w-1/2 bg-line/60" />
                      <span className="absolute left-1/2 top-1/4 h-1/2 w-px -translate-x-1/2 bg-line/60" />
                      <span className="absolute left-1/2 top-1/2 h-px w-1/2 bg-line/60" />
                    </div>
                  )
                }),
              )}
            </div>
          </div>
          <div className="border-t border-line/60 px-4 py-3 text-xs text-muted sm:px-6">
            {isAuthenticated
              ? 'Tip: the winner of every match auto-fills the next round slot. Only the admin can record results here.'
              : 'Brackets fill in as the admin records results. Winners advance automatically.'}
          </div>
        </section>
      )}

      {isAuthenticated && editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeEditor} />
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">
                {stageLabel(editor.stage)}
                {editor.match ? ' — Edit' : ` — ${slotTag(editor.stage, editor.slot)}`}
              </h3>
              {editor.match && (
                <button
                  type="button"
                  onClick={() => setDeleting(editor.match)}
                  className="rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-red-500/40 hover:text-red-400"
                >
                  Delete
                </button>
              )}
            </div>

            <div className="space-y-3">
              <PlayerSelect
                label="Home Player"
                players={players}
                value={homeId}
                onChange={setHomeId}
                excludeId={awayId}
                placeholder="Search player…"
              />
              <PlayerSelect
                label="Away Player"
                players={players}
                value={awayId}
                onChange={setAwayId}
                excludeId={homeId}
                placeholder="Search player…"
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">Home Score</span>
                  <input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pitch focus:ring-2 focus:ring-pitch/20"
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
                    className="w-full rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pitch focus:ring-2 focus:ring-pitch/20"
                  />
                </label>
              </div>
              <p className="text-[11px] text-muted">Knockout matches cannot end in a draw.</p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={closeEditor}
                disabled={busy}
                className="flex-1 rounded-xl border border-line bg-panel-2 px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMatch}
                disabled={busy}
                className="flex-1 rounded-xl bg-pitch px-4 py-2.5 text-sm font-bold text-night transition-colors hover:bg-pitch-dark disabled:opacity-50"
              >
                {busy ? 'Saving…' : editor.match ? 'Save Changes' : 'Record Match'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        title="Delete knockout match?"
        message={`Remove the ${deleting ? stageLabel(deleting.stage) : ''} match between ${deleting ? `${deleting.home?.name || '?'}` : ''} and ${deleting ? `${deleting.away?.name || '?'}` : ''}? Winners will no longer advance.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        busy={busy}
      />
    </div>
  )
}