const cors = require('cors')
const express = require('express')
const { env } = require('./config/env')
const { errorHandler } = require('./middleware/errorHandler')
const { notFound } = require('./middleware/notFound')
const authRoutes = require('./routes/authRoutes')
const boardCardRoutes = require('./routes/boardCardRoutes')
const boardsRoutes = require('./routes/boardsRoutes')
const cardRoutes = require('./routes/cardRoutes')

const app = express()

app.use(
  cors({
    credentials: true,
    origin: env.clientOrigin,
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: env.nodeEnv })
})

app.use('/api/auth', authRoutes)
app.use('/api/boards/:boardId/cards', boardCardRoutes)
app.use('/api/boards', boardsRoutes)
app.use('/api/cards', cardRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = { app }
