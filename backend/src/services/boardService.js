const { seedBoard } = require('../data/seedBoard')

let board = structuredClone(seedBoard)

const createId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

const findColumn = (columnId) => board.columns.find((column) => column.id === columnId)

const getBoard = () => board

const resetBoard = () => {
  board = structuredClone(seedBoard)
  return board
}

const createCard = (columnId, cardInput) => {
  const column = findColumn(columnId)

  if (!column) {
    return null
  }

  const card = {
    id: createId('card'),
    title: cardInput.title,
    description: cardInput.description || '',
    label: cardInput.label || 'General',
    assigneeId: cardInput.assigneeId || board.members[0]?.id || null,
  }

  column.cards.push(card)
  return card
}

const moveCard = (cardId, targetColumnId) => {
  const targetColumn = findColumn(targetColumnId)

  if (!targetColumn) {
    return null
  }

  for (const column of board.columns) {
    const cardIndex = column.cards.findIndex((card) => card.id === cardId)

    if (cardIndex >= 0) {
      const [card] = column.cards.splice(cardIndex, 1)
      targetColumn.cards.push(card)
      return card
    }
  }

  return null
}

module.exports = {
  createCard,
  getBoard,
  moveCard,
  resetBoard,
}
