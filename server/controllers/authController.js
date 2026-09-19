const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { signToken } = require('../middleware/auth')

const prisma = new PrismaClient()

async function login(req, res) {
  const { username, password } = req.body || {}

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  const admin = await prisma.admin.findUnique({ where: { username } })
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, admin.password)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signToken({ id: admin.id, username: admin.username })
  res.json({ token, username: admin.username })
}

async function changeCredentials(req, res) {
  const { currentPassword, username, password } = req.body || {}
  const adminId = req.admin.id

  const admin = await prisma.admin.findUnique({ where: { id: adminId } })
  if (!admin) {
    return res.status(404).json({ error: 'Admin not found' })
  }

  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required' })
  }
  const valid = await bcrypt.compare(currentPassword, admin.password)
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  const newUsername = username?.trim()
  const newPassword = password

  if (!newUsername && !newPassword) {
    return res.status(400).json({ error: 'Provide a new username and/or password' })
  }
  if (newPassword && newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  const data = {}
  if (newUsername) data.username = newUsername
  if (newPassword) data.password = await bcrypt.hash(newPassword, 10)

  try {
    const updated = await prisma.admin.update({ where: { id: adminId }, data })
    res.json({ message: 'Credentials updated', username: updated.username })
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'That username is already taken' })
    }
    throw e
  }
}

async function me(req, res) {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } })
  if (!admin) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  res.json({ id: admin.id, username: admin.username })
}

module.exports = { login, changeCredentials, me }