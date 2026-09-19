function resultBadge(m) {
  if (m.homeScore > m.awayScore) return { text: 'Home win', cls: 'text-pitch' }
  if (m.homeScore < m.awayScore) return { text: 'Away win', cls: 'text-sky-400' }
  return { text: 'Draw', cls: 'text-amber-400' }
}

function PlayedCard({ m }) {
  const badge = resultBadge(m)
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-pitch/25 bg-gradient-to-r from-pitch/10 via-panel/60 to-panel/60 px-4 py-3 transition-all hover:border-pitch/50 hover:shadow-lg hover:shadow-pitch/10">
      <div className="flex flex-1 items-center justify-end gap-2 truncate">
        <span className="truncate text-right font-semibold text-ink">{m.home.name}</span>
      </div>

      <div className="flex shrink-0 flex-col items-center rounded-2xl border border-pitch/40 bg-night/60 px-5 py-1.5">
        <p className="text-lg font-black tracking-widest text-ink">
          {m.homeScore} - {m.awayScore}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-pitch">Full time</p>
      </div>

      <div className="flex flex-1 items-center gap-2 truncate">
        <span className="truncate font-semibold text-ink">{m.away.name}</span>
      </div>

      <span
        className={`hidden shrink-0 rounded-full border border-line bg-panel-2 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:block ${badge.cls}`}
      >
        {badge.text}
      </span>
    </div>
  )
}

function UpcomingCard({ m }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-panel/30 px-4 py-3 transition-all hover:border-amber-400/50 hover:bg-panel/50">
      <div className="flex flex-1 items-center justify-end gap-2 truncate">
        <span className="truncate text-right font-semibold text-muted">{m.home.name}</span>
      </div>

      <div className="flex shrink-0 flex-col items-center rounded-2xl border border-line bg-panel-2/60 px-5 py-1.5">
        <p className="text-lg font-black tracking-widest text-muted">VS</p>
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          </span>
          Upcoming
        </p>
      </div>

      <div className="flex flex-1 items-center gap-2 truncate">
        <span className="truncate font-semibold text-muted">{m.away.name}</span>
      </div>
    </div>
  )
}

export default function RecentMatches({ matches, loading }) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl border border-line bg-panel/60" />
        ))}
      </div>
    )
  }

  if (!matches.length) {
    return (
      <div className="rounded-2xl border border-line bg-panel/60 py-12 text-center">
        <div className="mb-3 text-4xl">📋</div>
        <h3 className="text-lg font-semibold">No matches yet</h3>
        <p className="mt-1 text-sm text-muted">Admin can schedule matches from the dashboard.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-2.5">
      {matches.slice(0, 8).map((m) =>
        m.played && m.homeScore != null && m.awayScore != null ? (
          <PlayedCard key={m.id} m={m} />
        ) : (
          <UpcomingCard key={m.id} m={m} />
        )
      )}
    </div>
  )
}