const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function listPlayers(req, res) {
  const players = await prisma.player.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { homeMatches: true, awayMatches: true } } },
  })
  res.json(players)
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

module.exports = { listPlayers, createPlayer, updatePlayer, deletePlayer }