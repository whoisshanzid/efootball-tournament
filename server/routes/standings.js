const express = require('express')
const { getStandings, getPlayoffStandings } = require('../controllers/standingsController')

const router = express.Router()

router.get('/', getStandings)
router.get('/playoff', getPlayoffStandings)

module.exports = router