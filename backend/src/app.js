const cors = require('cors')
const express = require('express')
const { env } = require('./config/env')
const { errorHandler } = require('./middleware/errorHandler')
const { notFound } = require('./middleware/notFound')
const boardRoutes = require('./routes/boardRoutes')

const app = express()

app.use(
  cors({
    origin: env.clientOrigin,
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: env.nodeEnv })
})

app.use('/api/board', boardRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = { app }
