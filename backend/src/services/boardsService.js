const boardRepository = require('../repositories/boardRepository')

const ensureBoardOwner = async (boardId, userId) => {
  const board = await boardRepository.findBoardById(boardId)

  if (!board || board.ownerId !== userId) {
    return null
  }

  return board
}

const createBoard = (userId, boardInput) =>
  boardRepository.createBoard(userId, boardInput)

const getBoards = (userId) => boardRepository.findBoardsByOwnerId(userId)

const getBoard = (boardId, userId) => ensureBoardOwner(boardId, userId)

const updateBoard = async (boardId, userId, boardInput) => {
  const board = await ensureBoardOwner(boardId, userId)

  if (!board) {
    return null
  }

  return boardRepository.updateBoard(boardId, boardInput)
}

const deleteBoard = async (boardId, userId) => {
  const board = await ensureBoardOwner(boardId, userId)

  if (!board) {
    return null
  }

  await boardRepository.deleteBoard(boardId)
  return board
}

module.exports = {
  createBoard,
  deleteBoard,
  getBoard,
  getBoards,
  updateBoard,
}
