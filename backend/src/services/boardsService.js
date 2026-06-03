const boardRepository = require('../repositories/boardRepository')
const invitationRepository = require('../repositories/invitationRepository')
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

const inviteBoardMember = async (boardId, inviter, identifier) => {
  const ownerId = inviter.id
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

  if (board.memberIds?.includes(user.id)) {
    const error = new Error('User is already a member of this board.')
    error.status = 409
    throw error
  }

  const existingInvitation = await invitationRepository.findPendingInvitation(boardId, user.id)

  if (existingInvitation) {
    const error = new Error('This user already has a pending invitation.')
    error.status = 409
    throw error
  }

  const invitation = await invitationRepository.createInvitation({
    boardId,
    boardName: board.name,
    inviteeId: user.id,
    inviteeName: user.name,
    inviterId: inviter.id,
    inviterName: inviter.name,
  })

  return {
    invitation,
    invitee: user,
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
  createBoard,
  deleteBoard,
  getBoard,
  getBoards,
  inviteBoardMember,
  updateBoard,
}
