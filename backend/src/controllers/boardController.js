const boardService = require('../services/boardService')

const getBoard = (_req, res) => {
  res.json({ data: boardService.getBoard() })
}

const createCard = (req, res) => {
  const { columnId } = req.params
  const { title, description, label, assigneeId } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Card title is required.' })
  }

  const card = boardService.createCard(columnId, {
    title: title.trim(),
    description,
    label,
    assigneeId,
  })

  if (!card) {
    return res.status(404).json({ error: 'Column not found.' })
  }

  return res.status(201).json({ data: card })
}

const moveCard = (req, res) => {
  const { cardId } = req.params
  const { targetColumnId } = req.body

  if (!targetColumnId) {
    return res.status(400).json({ error: 'targetColumnId is required.' })
  }

  const card = boardService.moveCard(cardId, targetColumnId)

  if (!card) {
    return res.status(404).json({ error: 'Card or target column not found.' })
  }

  return res.json({ data: boardService.getBoard() })
}

const resetBoard = (_req, res) => {
  res.json({ data: boardService.resetBoard() })
}

module.exports = {
  createCard,
  getBoard,
  moveCard,
  resetBoard,
}
