export const ZONES = {
  super8: {
    match: (rank) => rank <= 8,
    color: '#38bdf8',
    border: 'border-sky-400',
    label: 'Super 8',
    description: 'Inside knockout stage',
  },
  playoff: {
    match: (rank) => rank > 8 && rank <= 24,
    color: '#eab308',
    border: 'border-yellow-400',
    label: 'Playoff Zone',
    description: 'Fighting for a knockout spot',
  },
  eliminated: {
    match: (rank) => rank > 24,
    color: '#f87171',
    border: 'border-red-400',
    label: 'Eliminated',
    description: 'Out of the knockout stage',
  },
}

export function getZone(rank) {
  return ZONES.super8.match(rank)
    ? ZONES.super8
    : ZONES.playoff.match(rank)
      ? ZONES.playoff
      : ZONES.eliminated
}

const rankBadge = {
  1: 'bg-gold/15 text-gold',
  2: 'bg-silver/15 text-silver',
  3: 'bg-bronze/15 text-bronze',
}

export default function StandingsTable({ standings, loading }) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-panel/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line/60 px-4 py-4 last:border-0">
            <div className="h-6 w-8 animate-pulse rounded bg-panel-2" />
            <div className="h-4 w-40 animate-pulse rounded bg-panel-2" />
            <div className="ml-auto h-4 w-10 animate-pulse rounded bg-panel-2" />
          </div>
        ))}
      </div>
    )
  }

  if (!standings.length) {
    return (
      <div className="rounded-2xl border border-line bg-panel/60 py-16 text-center">
        <div className="mb-3 text-4xl">⚽</div>
        <h3 className="text-lg font-semibold">No matches played yet</h3>
        <p className="mt-1 text-sm text-muted">Standings will appear once matches have scores.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel/60 shadow-xl shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line bg-panel-2/60 text-left text-xs uppercase tracking-wider text-muted">
              <th className="w-12 px-3 py-3.5 pl-4 font-semibold">#</th>
              <th className="px-3 py-3.5 font-semibold">Player</th>
              <th className="px-3 py-3.5 text-center font-semibold" title="Played">P</th>
              <th className="px-3 py-3.5 text-center font-semibold" title="Won">W</th>
              <th className="px-3 py-3.5 text-center font-semibold" title="Drawn">D</th>
              <th className="px-3 py-3.5 text-center font-semibold" title="Lost">L</th>
              <th className="px-3 py-3.5 text-center font-semibold" title="Goals For">GF</th>
              <th className="px-3 py-3.5 text-center font-semibold" title="Goals Against">GA</th>
              <th className="px-3 py-3.5 text-center font-semibold" title="Goal Difference">GD</th>
              <th className="px-3 py-3.5 pr-4 text-right font-semibold" title="Points">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => {
              const isTop = row.rank <= 3
              const zone = getZone(row.rank)
              return (
                <tr
                  key={row.playerId}
                  style={{ boxShadow: `inset 4px 0 0 0 ${zone.color}` }}
                  className={`border-b border-line/60 bg-gradient-to-r from-transparent to-transparent transition-colors last:border-0 hover:from-white/[0.02] hover:to-white/[0.01] ${
                    isTop ? 'bg-panel-2/40' : ''
                  }`}
                >
                  <td className="px-3 py-3.5 pl-4">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        isTop ? rankBadge[row.rank] : 'bg-panel-2 text-muted'
                      }`}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div>
                      <p className="font-semibold text-ink">{row.name}</p>
                      {row.team && <p className="text-xs text-muted">{row.team}</p>}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center font-semibold">{row.played}</td>
                  <td className="px-3 py-3.5 text-center text-pitch">{row.won}</td>
                  <td className="px-3 py-3.5 text-center text-amber-400">{row.drawn}</td>
                  <td className="px-3 py-3.5 text-center text-red-400">{row.lost}</td>
                  <td className="px-3 py-3.5 text-center">{row.goalsFor}</td>
                  <td className="px-3 py-3.5 text-center">{row.goalsAgainst}</td>
                  <td className="px-3 py-3.5 text-center font-semibold">{row.goalDifference}</td>
                  <td className="px-3 py-3.5 pr-4 text-right">
                    <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-pitch/15 px-2.5 py-1 text-sm font-bold text-pitch">
                      {row.points}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}