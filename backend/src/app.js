const cors = require('cors')
const express = require('express')
const { env } = require('./config/env')
const { errorHandler } = require('./middleware/errorHandler')
const { notFound } = require('./middleware/notFound')
const authRoutes = require('./routes/authRoutes')
const cardActivityRoutes = require('./routes/cardActivityRoutes')
const boardCardRoutes = require('./routes/boardCardRoutes')
const boardsRoutes = require('./routes/boardsRoutes')
const cardRoutes = require('./routes/cardRoutes')
const taskRoutes = require('./routes/taskRoutes')

const app = express()

app.use(
  cors({
    credentials: true,
    origin: env.clientOrigins,
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: env.nodeEnv })
})

app.use('/api/auth', authRoutes)
app.use('/api/boards/:boardId/cards/:cardId/details', cardActivityRoutes)
app.use('/api/boards/:boardId/cards/:cardId/tasks', taskRoutes)
app.use('/api/boards/:boardId/cards', boardCardRoutes)
app.use('/api/boards', boardsRoutes)
app.use('/api/cards', cardRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = { app }
