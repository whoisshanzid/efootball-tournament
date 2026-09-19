const express = require('express')
const { login, changeCredentials, me } = require('../controllers/authController')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.post('/login', login)
router.get('/me', requireAuth, me)
router.put('/credentials', requireAuth, changeCredentials)

module.exports = router