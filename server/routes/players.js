const express = require('express')
const { requireAuth } = require('../middleware/auth')
const {
  listPlayers,
  getPlayerProfile,
  createPlayer,
  updatePlayer,
  deletePlayer,
} = require('../controllers/playerController')

const router = express.Router()

router.get('/', listPlayers)
router.get('/:id/profile', getPlayerProfile)
router.post('/', requireAuth, createPlayer)
router.put('/:id', requireAuth, updatePlayer)
router.delete('/:id', requireAuth, deletePlayer)

module.exports = router