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

const publicMemberProfile = (user) => ({
  avatarUrl: user.avatarUrl,
  email: user.email,
  id: user.id,
  initials: user.initials,
  name: user.name,
  role: user.role,
  username: user.username,
})

const withOwnerMembers = async (board, userId) => {
  if (!board || board.ownerId !== userId) {
    return board
  }

  const memberIds = (board.memberIds || []).filter((memberId) => memberId !== board.ownerId)
  const members = await userRepository.findUsersByIds(memberIds)

  return {
    ...board,
    members: members.map(publicMemberProfile),
  }
}

const getBoards = async (userId) => {
  const boards = await boardRepository.findBoardsByUserId(userId)

  return Promise.all(boards.map((board) => withOwnerMembers(board, userId)))
}

const getBoard = async (boardId, userId) =>
  withOwnerMembers(await ensureBoardAccess(boardId, userId), userId)

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

const removeBoardMember = async (boardId, ownerId, memberId) => {
  const board = await ensureBoardOwner(boardId, ownerId)

  if (!board) {
    return null
  }

  if (memberId === board.ownerId) {
    const error = new Error('Board owner cannot be removed.')
    error.status = 400
    throw error
  }

  if (!board.memberIds?.includes(memberId)) {
    const error = new Error('User does not have access to this board.')
    error.status = 404
    throw error
  }

  return withOwnerMembers(await boardRepository.removeBoardMember(boardId, memberId), ownerId)
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
  removeBoardMember,
  updateBoard,
}
