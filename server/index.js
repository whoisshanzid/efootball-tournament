require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const playerRoutes = require('./routes/players')
const matchRoutes = require('./routes/matches')
const standingsRoutes = require('./routes/standings')

const app = express()
const PORT = process.env.PORT || 4000

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true

app.use(cors({ origin: corsOrigins }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/players', playerRoutes)
app.use('/api/matches', matchRoutes)
app.use('/api/standings', standingsRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})