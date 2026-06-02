const cardRepository = require('../repositories/cardRepository')
const cardActivityRepository = require('../repositories/cardActivityRepository')
const boardsService = require('./boardsService')

const ensureCardAccess = async (boardId, cardId, userId) => {
  const board = await boardsService.getBoard(boardId, userId)

  if (!board) {
    return null
  }

  const card = await cardRepository.findCardById(boardId, cardId)

  return card ? { board, card } : null
}

const getCardDetails = async (boardId, cardId, userId) => {
  const access = await ensureCardAccess(boardId, cardId, userId)

  if (!access) {
    return null
  }

  const [activities, comments] = await Promise.all([
    cardActivityRepository.findActivitiesByCardId(boardId, cardId),
    cardActivityRepository.findCommentsByCardId(boardId, cardId),
  ])

  return {
    activities,
    comments,
  }
}

const addActivity = async (boardId, cardId, user, activityInput) => {
  const access = await ensureCardAccess(boardId, cardId, user.id)

  if (!access) {
    return null
  }

  return cardActivityRepository.createActivity(boardId, cardId, {
    authorId: user.id,
    authorName: user.name || 'Someone',
    ...activityInput,
  })
}

const addComment = async (boardId, cardId, user, body) => {
  const access = await ensureCardAccess(boardId, cardId, user.id)

  if (!access) {
    return null
  }

  return cardActivityRepository.createComment(boardId, cardId, {
    authorId: user.id,
    authorName: user.name || 'Someone',
    body,
  })
}

module.exports = {
  addActivity,
  addComment,
  getCardDetails,
}
