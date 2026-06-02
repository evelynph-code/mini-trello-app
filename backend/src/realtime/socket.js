let io = null

const initializeSocket = (socketServer) => {
  io = socketServer

  io.on('connection', (socket) => {
    socket.on('board:join', ({ boardId }) => {
      if (boardId) {
        socket.join(`board:${boardId}`)
      }
    })

    socket.on('board:leave', ({ boardId }) => {
      if (boardId) {
        socket.leave(`board:${boardId}`)
      }
    })

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

const emitCardDetailsChanged = (boardId, cardId, payload) => {
  if (!io) {
    return
  }

  io.to(`tasks:${boardId}:${cardId}`).emit('card-details:changed', payload)
}

const emitBoardChanged = (boardId, payload) => {
  if (!io) {
    return
  }

  io.to(`board:${boardId}`).emit('board:changed', payload)
}

module.exports = {
  emitBoardChanged,
  emitCardDetailsChanged,
  emitTasksChanged,
  initializeSocket,
}
