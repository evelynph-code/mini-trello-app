const cardRepository = require('../repositories/cardRepository')
const taskRepository = require('../repositories/taskRepository')
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

const getTaskSummariesForBoard = async (boardId, userId) => {
  const board = await ensureBoardAccess(boardId, userId)

  if (!board) {
    return null
  }

  const cards = await cardRepository.findCardsByBoardId(boardId)

  return taskRepository.summarizeTasksByCardId(
    boardId,
    cards.map((card) => card.id),
  )
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

const updateCardOrderForBoard = async (boardId, userId, orderedCards) => {
  const board = await ensureBoardAccess(boardId, userId)

  if (!board) {
    return null
  }

  const cards = await cardRepository.findCardsByBoardId(boardId)
  const cardsById = new Map(cards.map((card) => [card.id, card]))

  const normalizedCards = orderedCards
    .filter((card) => cardsById.has(card.id))
    .map((card) => {
      const existingCard = cardsById.get(card.id)
      const listId = card.listId || existingCard.listId || defaultListId

      return {
        id: card.id,
        listId,
        listName: getListName(board, listId),
        position: Number.isFinite(card.position) ? card.position : existingCard.position,
      }
    })

  return cardRepository.updateCardOrder(boardId, normalizedCards)
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
  getTaskSummariesForBoard,
  updateCardOrderForBoard,
  updateCardForBoard,
}
