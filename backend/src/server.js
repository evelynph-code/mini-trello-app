const http = require('http')
const { Server } = require('socket.io')
const { app } = require('./app')
const { env, isAllowedClientOrigin } = require('./config/env')
const { initializeSocket } = require('./realtime/socket')

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    credentials: true,
    origin: (origin, callback) => {
      callback(null, isAllowedClientOrigin(origin))
    },
  },
})

initializeSocket(io)

server.listen(env.port, () => {
  console.log(`Mini Trello API running on http://localhost:${env.port}`)
})
