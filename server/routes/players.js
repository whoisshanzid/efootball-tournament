const express = require('express')
const { requireAuth } = require('../middleware/auth')
const {
  listPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
} = require('../controllers/playerController')

const router = express.Router()

router.get('/', listPlayers)
router.post('/', requireAuth, createPlayer)
router.put('/:id', requireAuth, updatePlayer)
router.delete('/:id', requireAuth, deletePlayer)

module.exports = router