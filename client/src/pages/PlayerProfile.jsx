import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import Logo from '../components/Logo'

function formatWinRate(r) {
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace(/\.0$/, '')
}

function StatCard({ label, value, accent, sub }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/60 p-4">
      <p className={`text-2xl font-black ${accent || 'text-ink'}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-muted">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted/70">{sub}</p>}
    </div>
  )
}

const resultStyles = {
  W: { text: 'Win', cls: 'bg-pitch/10 text-pitch border-pitch/30' },
  D: { text: 'Draw', cls: 'bg-amber-400/10 text-amber-400 border-amber-400/30' },
  L: { text: 'Loss', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
  PENDING: { text: 'Upcoming', cls: 'bg-panel-2 text-muted border-line' },
}

function HistoryRow({ m, playerName }) {
  const badge = resultStyles[m.result] || resultStyles.PENDING
  const played = m.played
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        played ? 'border-line bg-panel/50' : 'border-dashed border-line bg-panel/20'
      }`}
    >
      <span className={`hidden h-2.5 w-2.5 shrink-0 rounded-full sm:block ${played ? 'bg-pitch' : 'bg-muted/40'}`} />
      <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-2">
        <span className="truncate text-xs text-muted">
          <span className="font-semibold text-ink">{playerName}</span>
          <span className="mx-1.5 text-muted/50">·</span>
          <span className="font-medium">{m.side === 'home' ? 'Home' : 'Away'}</span>
        </span>
        <Link to={`/player/${m.opponent.id}`} className="group flex items-center gap-1.5 truncate">
          <span className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-pitch">
            vs {m.opponent.name}
          </span>
          {m.opponent.team && <span className="truncate text-xs text-muted">{m.opponent.team}</span>}
        </Link>
      </div>

      <div className="shrink-0 text-center">
        {played && m.playerScore != null ? (
          <p className="text-base font-black tracking-wide text-ink">
            {m.playerScore} <span className="text-muted">–</span> {m.opponentScore}
          </p>
        ) : (
          <p className="text-base font-black tracking-wide text-muted">VS</p>
        )}
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
          {new Date(m.createdAt).toLocaleDateString()}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}
      >
        {badge.text}
      </span>
    </div>
  )
}

export default function PlayerProfile() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let alive = true
    setStatus('loading')
    api
      .get(`/players/${id}/profile`)
      .then((res) => {
        if (!alive) return
        setData(res.data)
        setStatus('ok')
      })
      .catch((err) => {
        if (!alive) return
        setStatus(err?.response?.status === 404 ? 'notfound' : 'error')
      })
    return () => {
      alive = false
    }
  }, [id])

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Logo className="h-14 w-14 animate-pulse drop-shadow-lg" />
        <p className="text-sm text-muted">Loading player profile…</p>
      </div>
    )
  }

  if (status === 'notfound') {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-panel/60 py-14 text-center">
        <div className="mb-3 text-4xl">🤷</div>
        <h2 className="text-lg font-bold text-ink">Player not found</h2>
        <p className="mt-1 text-sm text-muted">This player may have been removed.</p>
        <Link
          to="/players"
          className="mt-5 inline-flex rounded-xl bg-pitch px-4 py-2 text-sm font-bold text-night transition-colors hover:brightness-110"
        >
          Back to Players
        </Link>
      </div>
    )
  }

  if (status === 'error' || !data) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-panel/60 py-14 text-center">
        <div className="mb-3 text-4xl">⚠️</div>
        <h2 className="text-lg font-bold text-ink">Could not load profile</h2>
        <p className="mt-1 text-sm text-muted">Check your connection and try again.</p>
      </div>
    )
  }

  const { player, stats } = data

  return (
    <div className="space-y-6">
      <Link
        to="/players"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-pitch"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Players
      </Link>

      <section className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel via-panel/80 to-pitch-deep/20 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-pitch/30 bg-gradient-to-br from-pitch/30 to-pitch-deep/40 text-2xl font-black text-pitch">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{player.name}</h1>
            {player.team && <p className="mt-1 text-sm text-muted">{player.team}</p>}
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-pitch">
              {stats.played} match{stats.played === 1 ? '' : 'es'} played
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Win Rate"
          value={`${formatWinRate(stats.winRate)}%`}
          accent="text-pitch"
          sub={`${stats.won}W · ${stats.drawn}D · ${stats.lost}L`}
        />
        <StatCard label="Total Goals" value={stats.totalGoals} sub={`${stats.goalsFor} for · ${stats.goalsAgainst} against`} />
        <StatCard label="Points" value={stats.points} />
        <StatCard label="Goal Difference" value={stats.goalDifference} accent={stats.goalDifference > 0 ? 'text-pitch' : stats.goalDifference < 0 ? 'text-red-400' : undefined} />
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-bold text-ink">Match History</h2>
          <span className="rounded-full bg-pitch/10 px-2.5 py-0.5 text-xs font-semibold text-pitch">
            {data.matches.length}
          </span>
        </div>

        {data.matches.length === 0 ? (
          <div className="rounded-2xl border border-line bg-panel/60 py-12 text-center">
            <div className="mb-3 text-4xl">⚽</div>
            <h3 className="text-lg font-semibold">No matches yet</h3>
            <p className="mt-1 text-sm text-muted">This player's history will appear here once matches are recorded.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.matches.map((m) => (
              <HistoryRow key={m.matchId} m={m} playerName={player.name} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}