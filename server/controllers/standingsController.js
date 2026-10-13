const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const WIN_POINTS = 3
const DRAW_POINTS = 1

const PLAYOFF_FIRST_RANK = 9
const PLAYOFF_LAST_RANK = 22
const PLAYOFF_QUALIFIERS = 8

async function computeStandings(stage) {
  const playedMatches = await prisma.match.findMany({
    where: { played: true, stage },
    select: { homeId: true, awayId: true, homeScore: true, awayScore: true },
  })

  const stats = new Map()

  const ensurePlayer = (id) => {
    if (!stats.has(id)) {
      stats.set(id, {
        playerId: id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      })
    }
    return stats.get(id)
  }

  for (const m of playedMatches) {
    if (m.homeScore == null || m.awayScore == null) continue

    const home = ensurePlayer(m.homeId)
    const away = ensurePlayer(m.awayId)
    home.played++
    away.played++
    home.goalsFor += m.homeScore
    home.goalsAgainst += m.awayScore
    away.goalsFor += m.awayScore
    away.goalsAgainst += m.homeScore

    if (m.homeScore > m.awayScore) {
      home.won++
      home.points += WIN_POINTS
      away.lost++
    } else if (m.homeScore < m.awayScore) {
      away.won++
      away.points += WIN_POINTS
      home.lost++
    } else {
      home.drawn++
      away.drawn++
      home.points += DRAW_POINTS
      away.points += DRAW_POINTS
    }
  }

  const playerIds = Array.from(stats.keys())
  const playerMap = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    select: { id: true, name: true, team: true, active: true },
  })
  const idToPlayer = new Map(playerMap.map((p) => [p.id, p]))

  return Array.from(stats.values())
    .map((s) => ({
      playerId: s.playerId,
      name: idToPlayer.get(s.playerId)?.name || 'Unknown',
      team: idToPlayer.get(s.playerId)?.team || null,
      active: idToPlayer.get(s.playerId)?.active ?? true,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDifference: s.goalsFor - s.goalsAgainst,
      points: s.points,
    }))
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

async function getStandings(req, res) {
  const rows = await computeStandings('GROUP')
  res.json(rows)
}

async function getPlayoffStandings(req, res) {
  const groupRows = await computeStandings('GROUP')
  const entrants = groupRows.filter(
    (row) => row.rank >= PLAYOFF_FIRST_RANK && row.rank <= PLAYOFF_LAST_RANK && row.active !== false,
  )

  const playoffRows = await computeStandings('PLAYOFF')
  const playoffById = new Map(playoffRows.map((row) => [row.playerId, row]))

  const rows = entrants
    .map((entrant) => {
      const row = playoffById.get(entrant.playerId)
      return (
        row || {
          playerId: entrant.playerId,
          name: entrant.name,
          team: entrant.team,
          active: entrant.active !== false,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        }
      )
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      qualified: index < PLAYOFF_QUALIFIERS,
    }))

  res.json(rows)
}

module.exports = { getStandings, getPlayoffStandings }
