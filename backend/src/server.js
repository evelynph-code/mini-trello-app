const http = require('http')
const { Server } = require('socket.io')
const { app } = require('./app')
const { env } = require('./config/env')
const { initializeSocket } = require('./realtime/socket')

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    credentials: true,
    origin: env.clientOrigins,
  },
})

initializeSocket(io)

server.listen(env.port, () => {
  console.log(`Mini Trello API running on http://localhost:${env.port}`)
})
