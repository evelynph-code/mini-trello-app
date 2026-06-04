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

const ensureDefaultBoard = async (userId) => {
  const defaultBoard = await boardRepository.findDefaultBoardByUserId(userId)

  return defaultBoard || boardRepository.createDefaultBoard(userId)
}

const publicMemberProfile = (user) => ({
  avatarUrl: user.avatarUrl,
  email: user.email,
  id: user.id,
  initials: user.initials,
  name: user.name,
  role: user.role,
  username: user.username,
})

const withBoardMembers = async (board) => {
  if (!board) {
    return board
  }

  const memberIds = board.memberIds || []
  const members = await userRepository.findUsersByIds(memberIds)

  return {
    ...board,
    members: members.map(publicMemberProfile),
  }
}

const getBoards = async (userId) => {
  await ensureDefaultBoard(userId)
  const boards = await boardRepository.findBoardsByUserId(userId)
  const sortedBoards = [...boards].sort((firstBoard, secondBoard) => {
    if (firstBoard.isDefault && !secondBoard.isDefault) {
      return -1
    }

    if (!firstBoard.isDefault && secondBoard.isDefault) {
      return 1
    }

    return firstBoard.name.localeCompare(secondBoard.name)
  })

  return Promise.all(sortedBoards.map(withBoardMembers))
}

const getBoard = async (boardId, userId) =>
  withBoardMembers(await ensureBoardAccess(boardId, userId))

const updateBoard = async (boardId, userId, boardInput) => {
  const board = await ensureBoardAccess(boardId, userId)

  if (!board) {
    return null
  }

  const isRenamingBoard = boardInput.name !== board.name

  if (isRenamingBoard && board.ownerId !== userId) {
    const error = new Error('Only the board owner can rename this board.')
    error.status = 403
    throw error
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

  return withBoardMembers(await boardRepository.removeBoardMember(boardId, memberId))
}

const leaveBoard = async (boardId, userId) => {
  const board = await ensureBoardAccess(boardId, userId)

  if (!board) {
    return null
  }

  if (board.ownerId === userId) {
    const error = new Error('Board owners cannot leave their own board.')
    error.status = 400
    throw error
  }

  if (!board.memberIds?.includes(userId)) {
    const error = new Error('You do not have access to this board.')
    error.status = 404
    throw error
  }

  return withBoardMembers(await boardRepository.removeBoardMember(boardId, userId))
}

const deleteBoard = async (boardId, userId) => {
  const board = await ensureBoardOwner(boardId, userId)

  if (!board) {
    return null
  }

  if (board.isDefault) {
    const error = new Error('The default board cannot be deleted.')
    error.status = 400
    throw error
  }

  await boardRepository.deleteBoardCascade(boardId)
  return board
}

module.exports = {
  createBoard,
  deleteBoard,
  getBoard,
  getBoards,
  inviteBoardMember,
  leaveBoard,
  removeBoardMember,
  updateBoard,
}
