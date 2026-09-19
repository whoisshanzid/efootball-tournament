import { CSV_PREFIX } from '../config'

export function downloadStandingsCSV(standings) {
  const headers = ['Rank', 'Player', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts']
  const rows = standings.map((r) => [
    r.rank,
    r.name,
    r.team || '',
    r.played,
    r.won,
    r.drawn,
    r.lost,
    r.goalsFor,
    r.goalsAgainst,
    r.goalDifference,
    r.points,
  ])

  const csv =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${CSV_PREFIX}-point-table-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}