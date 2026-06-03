const boardRepository = require('../repositories/boardRepository')
const userRepository = require('../repositories/userRepository')

const hasBoardAccess = (board, userId) =>
  board?.ownerId === userId || board?.memberIds?.includes(userId)

const ensureBoardAccess = async (boardId, userId) => {
  const board = await boardRepository.findBoardById(boardId)

  if (!hasBoardAccess(board, userId)) {
    return null
  }

  return board
}

const ensureBoardOwner = async (boardId, userId) => {
  const board = await boardRepository.findBoardById(boardId)

  if (!board || board.ownerId !== userId) {
    return null
  }

  return board
}

const createBoard = (userId, boardInput) =>
  boardRepository.createBoard(userId, boardInput)

const getBoards = (userId) => boardRepository.findBoardsByUserId(userId)

const getBoard = (boardId, userId) => ensureBoardAccess(boardId, userId)

const updateBoard = async (boardId, userId, boardInput) => {
  const board = await ensureBoardAccess(boardId, userId)

  if (!board) {
    return null
  }

  return boardRepository.updateBoard(boardId, boardInput)
}

const addBoardMember = async (boardId, ownerId, identifier) => {
  const board = await ensureBoardOwner(boardId, ownerId)

  if (!board) {
    return null
  }

  const user = await userRepository.findUserByIdentifier(identifier)

  if (!user) {
    const error = new Error('User not found.')
    error.status = 404
    throw error
  }

  const updatedBoard = await boardRepository.addBoardMember(boardId, user.id)

  return {
    board: updatedBoard,
    member: user,
  }
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
  addBoardMember,
  createBoard,
  deleteBoard,
  getBoard,
  getBoards,
  updateBoard,
}
