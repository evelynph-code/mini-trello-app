const cardRepository = require('../repositories/cardRepository')
const boardsService = require('./boardsService')

const defaultListId = 'today'

const getListName = (board, listId) =>
  board.lists.find((list) => list.id === listId)?.name || 'Today'

const ensureBoardAccess = async (boardId, userId) => boardsService.getBoard(boardId, userId)

const getCardsForBoard = async (boardId, userId) => {
  const board = await ensureBoardAccess(boardId, userId)

  if (!board) {
    return null
  }

  return cardRepository.findCardsByBoardId(boardId)
}

const getCardsForUser = (userId) => cardRepository.findCardsByAssigneeId(userId)

const getCardForBoard = async (boardId, cardId, userId) => {
  const board = await ensureBoardAccess(boardId, userId)

  if (!board) {
    return null
  }

  return cardRepository.findCardById(boardId, cardId)
}

const createCardForBoard = async (boardId, userId, cardInput) => {
  const board = await ensureBoardAccess(boardId, userId)

  if (!board) {
    return null
  }

  const listId = cardInput.listId || defaultListId

  return cardRepository.createCard(boardId, {
    assigneeId: userId,
    description: cardInput.description,
    label: cardInput.label,
    listId,
    listName: getListName(board, listId),
    position: cardInput.position,
    title: cardInput.title,
  })
}

const updateCardForBoard = async (boardId, cardId, userId, cardInput) => {
  const board = await ensureBoardAccess(boardId, userId)

  if (!board) {
    return null
  }

  const card = await cardRepository.findCardById(boardId, cardId)

  if (!card) {
    return null
  }

  const listId = cardInput.listId || card.listId || defaultListId

  return cardRepository.updateCard(boardId, cardId, {
    description: cardInput.description,
    label: cardInput.label,
    listId,
    listName: getListName(board, listId),
    position: Number.isFinite(cardInput.position) ? cardInput.position : card.position,
    title: cardInput.title,
  })
}

const deleteCardForBoard = async (boardId, cardId, userId) => {
  const board = await ensureBoardAccess(boardId, userId)

  if (!board) {
    return null
  }

  const card = await cardRepository.findCardById(boardId, cardId)

  if (!card) {
    return null
  }

  await cardRepository.deleteCard(boardId, cardId)
  return card
}

module.exports = {
  createCardForBoard,
  deleteCardForBoard,
  getCardForBoard,
  getCardsForBoard,
  getCardsForUser,
  updateCardForBoard,
}
