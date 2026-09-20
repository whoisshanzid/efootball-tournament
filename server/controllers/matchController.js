const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const matchInclude = {
  include: {
    home: { select: { id: true, name: true, team: true } },
    away: { select: { id: true, name: true, team: true } },
  },
}

const SLOT_RANGES = { R16: [1, 8], QF: [1, 4], SF: [1, 2], F: [1, 1] }
const KNOCKOUT_STAGES = Object.keys(SLOT_RANGES)

function isKnockoutStage(stage) {
  return KNOCKOUT_STAGES.includes(stage)
}

function isInt(n) {
  return Number.isInteger(n)
}

async function validateStageSlot(stage, slot, excludeMatchId = null) {
  const resolvedStage = stage === undefined || stage === null ? 'GROUP' : stage

  if (resolvedStage !== 'GROUP' && !isKnockoutStage(resolvedStage)) {
    return { stage: 'GROUP', slot: 0, error: 'Invalid stage' }
  }

  if (resolvedStage === 'GROUP') {
    return { stage: resolvedStage, slot: 0, error: null }
  }

  if (!isInt(slot)) {
    return { stage: resolvedStage, slot, error: 'A valid bracket slot is required' }
  }

  const [min, max] = SLOT_RANGES[resolvedStage]
  if (slot < min || slot > max) {
    return { stage: resolvedStage, slot, error: `Slot must be ${min}-${max} for stage ${resolvedStage}` }
  }

  const taken = await prisma.match.findFirst({
    where: {
      stage: resolvedStage,
      slot,
      ...(excludeMatchId ? { NOT: { id: excludeMatchId } } : {}),
    },
  })
  if (taken) {
    return { stage: resolvedStage, slot, error: 'That bracket slot is already taken' }
  }

  return { stage: resolvedStage, slot, error: null }
}

async function listMatches(req, res) {
  const matches = await prisma.match.findMany({
    ...matchInclude,
    orderBy: { createdAt: 'desc' },
  })
  res.json(matches)
}

async function createMatch(req, res) {
  const { homeId, awayId, homeScore, awayScore, played, stage, slot } = req.body || {}
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

  const { stage: resolvedStage, slot: resolvedSlot, error: slotError } = await validateStageSlot(stage, Number(slot))
  if (slotError) {
    return res.status(400).json({ error: slotError })
  }

  if (isKnockoutStage(resolvedStage) && isPlayed && hScore === aScore) {
    return res.status(400).json({ error: 'Knockout matches cannot end in a draw' })
  }

  const match = await prisma.match.create({
    data: {
      homeId: home,
      awayId: away,
      homeScore: hScore,
      awayScore: aScore,
      played: isPlayed,
      stage: resolvedStage,
      slot: resolvedSlot,
    },
    ...matchInclude,
  })
  res.status(201).json(match)
}

async function updateMatch(req, res) {
  const { id } = req.params
  const numericId = Number(id)
  const { homeId, awayId, homeScore, awayScore, played, stage, slot } = req.body || {}

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

  const { stage: resolvedStage, slot: resolvedSlot, error: slotError } = await validateStageSlot(
    stage !== undefined ? stage : existing.stage,
    slot !== undefined ? Number(slot) : existing.slot,
    numericId,
  )
  if (slotError) {
    return res.status(400).json({ error: slotError })
  }

  if (isKnockoutStage(resolvedStage) && isPlayed && hScore === aScore) {
    return res.status(400).json({ error: 'Knockout matches cannot end in a draw' })
  }

  const match = await prisma.match.update({
    where: { id: numericId },
    data: {
      homeId: home,
      awayId: away,
      homeScore: hScore,
      awayScore: aScore,
      played: isPlayed,
      stage: resolvedStage,
      slot: resolvedSlot,
    },
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