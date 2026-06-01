let io = null

const initializeSocket = (socketServer) => {
  io = socketServer

  io.on('connection', (socket) => {
    socket.on('tasks:join', ({ boardId, cardId }) => {
      if (boardId && cardId) {
        socket.join(`tasks:${boardId}:${cardId}`)
      }
    })

    socket.on('tasks:leave', ({ boardId, cardId }) => {
      if (boardId && cardId) {
        socket.leave(`tasks:${boardId}:${cardId}`)
      }
    })
  })
}

const emitTasksChanged = (boardId, cardId, payload) => {
  if (!io) {
    return
  }

  io.to(`tasks:${boardId}:${cardId}`).emit('tasks:changed', payload)
}

module.exports = {
  emitTasksChanged,
  initializeSocket,
}
