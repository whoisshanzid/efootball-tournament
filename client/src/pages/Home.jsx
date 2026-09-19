import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api/client'
import StandingsTable, { ZONES } from '../components/StandingsTable'
import RecentMatches from '../components/RecentMatches'
import { downloadStandingsCSV } from '../utils/csv'
import { CLUB_NAME, TOURNAMENT_NAME } from '../config'

const REFRESH_INTERVAL = 10000

function ZoneLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.values(ZONES).map((zone) => (
        <span
          key={zone.label}
          className="flex items-center gap-1.5 rounded-full border border-line bg-panel/70 px-2.5 py-1 text-[11px] font-medium text-muted"
        >
          <span className="h-3 w-1 rounded-full" style={{ backgroundColor: zone.color }} />
          {zone.label}
        </span>
      ))}
    </div>
  )
}

export default function Home() {
  const [standings, setStandings] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const fetchAll = useCallback(async (asSilent) => {
    if (!asSilent) setLoading(true)
    try {
      const [standingsRes, matchesRes] = await Promise.all([api.get('/standings'), api.get('/matches')])
      setStandings(standingsRes.data)
      setMatches(matchesRes.data)
      setLastUpdated(new Date())
    } catch {
      if (!asSilent) {
        setStandings([])
        setMatches([])
      }
    } finally {
      if (!asSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll(false)

    timerRef.current = setInterval(() => fetchAll(true), REFRESH_INTERVAL)
    const onFocus = () => fetchAll(true)
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(timerRef.current)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchAll])

  const handleDownload = () => {
    if (!standings.length) {
      toast.error('No standings to export yet')
      return
    }
    downloadStandingsCSV(standings)
    toast.success('Point table exported as CSV')
  }

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel via-panel/80 to-pitch-deep/20 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-pitch/30 bg-pitch/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-pitch">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pitch opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-pitch" />
              </span>
              {CLUB_NAME}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
              {TOURNAMENT_NAME.split(' ').slice(0, 1)}{' '}
              <span className="bg-gradient-to-r from-pitch to-white bg-clip-text text-transparent">
                {TOURNAMENT_NAME.split(' ').slice(1).join(' ')}
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Win <span className="font-semibold text-pitch">3 pts</span> · Draw{' '}
              <span className="font-semibold text-amber-400">1 pt</span> · Loss{' '}
              <span className="font-semibold text-red-400">0 pts</span> — Top 8 advance to the
              Super 8 knockout stage.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pitch to-pitch-dark px-4 py-2.5 text-sm font-bold text-night shadow-lg shadow-pitch/20 transition-all hover:shadow-pitch/40 hover:brightness-110 disabled:opacity-50"
            >
              <svg className="h-4 w-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0 0l-4-4m4 4l4-4" />
              </svg>
              Download CSV
            </button>
            {lastUpdated && (
              <p className="text-xs text-muted">Auto-refreshing · {lastUpdated.toLocaleTimeString()}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
          <ZoneLegend />
          <p className="text-[11px] text-muted">
            Blue = Super 8 (1–8) · Yellow = Playoff zone (9–24) · Red = Eliminated (25+)
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <StandingsTable standings={standings} loading={loading} />
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-bold text-ink">Recent Matches</h2>
          {!loading && (
            <span className="rounded-full bg-pitch/10 px-2.5 py-0.5 text-xs font-semibold text-pitch">
              {matches.length}
            </span>
          )}
        </div>
        <RecentMatches matches={matches} loading={loading} />
      </section>
    </div>
  )
}