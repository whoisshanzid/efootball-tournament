import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Logo from '../components/Logo'
import { CLUB_NAME } from '../config'

export default function Players() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    api
      .get('/players')
      .then((res) => {
        if (!alive) return
        setPlayers(res.data)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setError(true)
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return players
    return players.filter((p) => p.name.toLowerCase().includes(q) || (p.team || '').toLowerCase().includes(q))
  }, [players, query])

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel via-panel/80 to-pitch-deep/20 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-pitch/30 bg-pitch/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-pitch">
              {CLUB_NAME}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Players</h1>
            <p className="mt-2 text-sm text-muted">
              Browse every {CLUB_NAME} player — open a profile to see win rate, goals, and full match history.
            </p>
          </div>
          {!loading && !error && (
            <span className="rounded-full border border-line bg-panel/70 px-3 py-1 text-xs font-semibold text-muted">
              {players.length} player{players.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </section>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-line bg-panel/60" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-line bg-panel/60 py-14 text-center">
          <div className="mb-3 text-4xl">⚠️</div>
          <h3 className="text-lg font-semibold">Could not load players</h3>
          <p className="mt-1 text-sm text-muted">Check your connection and try again.</p>
        </div>
      ) : players.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel/60 py-14 text-center">
          <div className="mb-3 text-4xl">👥</div>
          <h3 className="text-lg font-semibold">No players yet</h3>
          <p className="mt-1 text-sm text-muted">Players will appear here once the admin adds them.</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players…"
              className="w-full rounded-xl border border-line bg-panel-2/60 py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pitch focus:ring-2 focus:ring-pitch/20"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-line bg-panel/60 py-12 text-center">
              <h3 className="text-lg font-semibold">No matches for "{query}"</h3>
              <p className="mt-1 text-sm text-muted">Try a different name.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => {
                const total = p._count?.homeMatches + p._count?.awayMatches
                return (
                  <Link
                    key={p.id}
                    to={`/player/${p.id}`}
                    className="group flex items-center gap-3.5 rounded-2xl border border-line bg-panel/50 px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-pitch/40 hover:bg-panel/80 hover:shadow-lg hover:shadow-pitch/10"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-pitch/30 bg-gradient-to-br from-pitch/25 to-pitch-deep/30 text-base font-black text-pitch transition-transform group-hover:scale-105">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink transition-colors group-hover:text-pitch">{p.name}</p>
                      <p className="truncate text-xs text-muted">
                        {p.team || 'No team'}
                        <span className="mx-1 text-muted/40">·</span>
                        {total} match{total === 1 ? '' : 'es'}
                      </p>
                    </div>
                    <svg className="ml-auto h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}