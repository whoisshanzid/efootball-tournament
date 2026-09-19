const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const matchInclude = {
  include: {
    home: { select: { id: true, name: true, team: true } },
    away: { select: { id: true, name: true, team: true } },
  },
}

async function listMatches(req, res) {
  const matches = await prisma.match.findMany({
    ...matchInclude,
    orderBy: { createdAt: 'desc' },
  })
  res.json(matches)
}

async function createMatch(req, res) {
  const { homeId, awayId, homeScore, awayScore, played } = req.body || {}
  const [home, away] = [Number(homeId), Number(awayId)]

  if (!home || !away) {
    return res.status(400).json({ error: 'Both players must be selected' })
  }
  if (home === away) {
    return res.status(400).json({ error: 'A player cannot play against themselves' })
  }

  const players = await prisma.player.findMany({
    where: { id: { in: [home, away] } },
  })
  if (players.length !== 2) {
    return res.status(400).json({ error: 'One or both players do not exist' })
  }

  const isPlayed = Boolean(played)
  const hScore = isPlayed ? Number(homeScore) : null
  const aScore = isPlayed ? Number(awayScore) : null

  if (isPlayed && (isNaN(hScore) || isNaN(aScore) || hScore < 0 || aScore < 0)) {
    return res.status(400).json({ error: 'Valid home and away scores are required' })
  }

  const match = await prisma.match.create({
    data: { homeId: home, awayId: away, homeScore: hScore, awayScore: aScore, played: isPlayed },
    ...matchInclude,
  })
  res.status(201).json(match)
}

async function updateMatch(req, res) {
  const { id } = req.params
  const numericId = Number(id)
  const { homeId, awayId, homeScore, awayScore, played } = req.body || {}

  const existing = await prisma.match.findUnique({ where: { id: numericId } })
  if (!existing) {
    return res.status(404).json({ error: 'Match not found' })
  }

  const home = homeId !== undefined ? Number(homeId) : existing.homeId
  const away = awayId !== undefined ? Number(awayId) : existing.awayId

  if (home === away) {
    return res.status(400).json({ error: 'A player cannot play against themselves' })
  }

  const players = await prisma.player.findMany({ where: { id: { in: [home, away] } } })
  if (players.length !== 2) {
    return res.status(400).json({ error: 'One or both players do not exist' })
  }

  const isPlayed = played !== undefined ? Boolean(played) : existing.played
  const hScore = isPlayed ? (homeScore !== undefined ? Number(homeScore) : existing.homeScore) : null
  const aScore = isPlayed ? (awayScore !== undefined ? Number(awayScore) : existing.awayScore) : null

  if (isPlayed && (hScore == null || aScore == null || isNaN(hScore) || isNaN(aScore) || hScore < 0 || aScore < 0)) {
    return res.status(400).json({ error: 'Valid home and away scores are required' })
  }

  const match = await prisma.match.update({
    where: { id: numericId },
    data: { homeId: home, awayId: away, homeScore: hScore, awayScore: aScore, played: isPlayed },
    ...matchInclude,
  })
  res.json(match)
}

async function deleteMatch(req, res) {
  const { id } = req.params
  const numericId = Number(id)

  const existing = await prisma.match.findUnique({ where: { id: numericId } })
  if (!existing) {
    return res.status(404).json({ error: 'Match not found' })
  }

  await prisma.match.delete({ where: { id: numericId } })
  res.json({ message: 'Match deleted' })
}

module.exports = { listMatches, createMatch, updateMatch, deleteMatch }