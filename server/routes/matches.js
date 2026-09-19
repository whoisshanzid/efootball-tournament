const express = require('express')
const { requireAuth } = require('../middleware/auth')
const {
  listMatches,
  createMatch,
  updateMatch,
  deleteMatch,
} = require('../controllers/matchController')

const router = express.Router()

router.get('/', listMatches)
router.post('/', requireAuth, createMatch)
router.put('/:id', requireAuth, updateMatch)
router.delete('/:id', requireAuth, deleteMatch)

module.exports = router