const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function listPlayers(req, res) {
  const players = await prisma.player.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { homeMatches: true, awayMatches: true } } },
  })
  res.json(players)
}

async function getPlayerProfile(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid player id' })
  }

  const player = await prisma.player.findUnique({
    where: { id },
    select: { id: true, name: true, team: true },
  })
  if (!player) {
    return res.status(404).json({ error: 'Player not found' })
  }

  const matches = await prisma.match.findMany({
    where: { stage: 'GROUP', OR: [{ homeId: id }, { awayId: id }] },
    include: {
      home: { select: { id: true, name: true, team: true } },
      away: { select: { id: true, name: true, team: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  let played = 0
  let won = 0
  let drawn = 0
  let lost = 0
  let goalsFor = 0
  let goalsAgainst = 0
  let points = 0

  for (const m of matches) {
    if (!m.played || m.homeScore == null || m.awayScore == null) continue
    const isHome = m.homeId === id
    const gf = isHome ? m.homeScore : m.awayScore
    const ga = isHome ? m.awayScore : m.homeScore
    played++
    goalsFor += gf
    goalsAgainst += ga
    if (gf > ga) {
      won++
      points += 3
    } else if (gf < ga) {
      lost++
    } else {
      drawn++
      points += 1
    }
  }

  const winRate = played === 0 ? 0 : Math.round(((won + 0.5 * drawn) / played) * 1000) / 10

  const history = matches.map((m) => {
    const isHome = m.homeId === id
    const opponent = isHome ? m.away : m.home
    const playerScore = isHome ? m.homeScore : m.awayScore
    const opponentScore = isHome ? m.awayScore : m.homeScore
    let result = 'PENDING'
    if (m.played && playerScore != null && opponentScore != null) {
      result = playerScore > opponentScore ? 'W' : playerScore < opponentScore ? 'L' : 'D'
    }
    return {
      matchId: m.id,
      played: m.played,
      side: isHome ? 'home' : 'away',
      playerScore,
      opponentScore,
      result,
      createdAt: m.createdAt,
      opponent: { id: opponent.id, name: opponent.name, team: opponent.team },
    }
  })

  res.json({
    player,
    stats: {
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points,
      winRate,
      totalGoals: goalsFor,
    },
    matches: history,
  })
}

async function createPlayer(req, res) {
  const { name, team } = req.body || {}

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Player name is required' })
  }

  try {
    const player = await prisma.player.create({
      data: { name: name.trim(), team: team?.trim() || null },
    })
    res.status(201).json(player)
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'A player with that name already exists' })
    }
    throw e
  }
}

async function updatePlayer(req, res) {
  const { id } = req.params
  const { name, team } = req.body || {}
  const numericId = Number(id)

  const existing = await prisma.player.findUnique({ where: { id: numericId } })
  if (!existing) {
    return res.status(404).json({ error: 'Player not found' })
  }

  try {
    const player = await prisma.player.update({
      where: { id: numericId },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        team: team !== undefined ? team.trim() || null : existing.team,
      },
    })
    res.json(player)
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'A player with that name already exists' })
    }
    throw e
  }
}

async function deletePlayer(req, res) {
  const { id } = req.params
  const numericId = Number(id)

  const existing = await prisma.player.findUnique({ where: { id: numericId } })
  if (!existing) {
    return res.status(404).json({ error: 'Player not found' })
  }

  await prisma.player.delete({ where: { id: numericId } })
  res.json({ message: 'Player deleted' })
}

module.exports = { listPlayers, getPlayerProfile, createPlayer, updatePlayer, deletePlayer }