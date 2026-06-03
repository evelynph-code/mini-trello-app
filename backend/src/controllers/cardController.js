const { emitBoardChanged } = require('../realtime/socket')
const cardService = require('../services/cardService')

const emitCardsChanged = async (boardId, userId) => {
  const cards = await cardService.getCardsForBoard(boardId, userId)

  if (!cards) {
    return
  }

  emitBoardChanged(boardId, {
    boardId,
    cards,
    resource: 'cards',
  })
}

const getCardsForUser = async (req, res, next) => {
  try {
    res.json({ data: await cardService.getCardsForUser(req.user.id) })
  } catch (err) {
    next(err)
  }
}

const getBoardCards = async (req, res, next) => {
  try {
    const cards = await cardService.getCardsForBoard(req.params.boardId, req.user.id)

    if (!cards) {
      return res.status(404).json({ error: 'Board not found.' })
    }

    return res.json({ data: cards })
  } catch (err) {
    return next(err)
  }
}

const getBoardCard = async (req, res, next) => {
  try {
    const card = await cardService.getCardForBoard(
      req.params.boardId,
      req.params.id,
      req.user.id,
    )

    if (!card) {
      return res.status(404).json({ error: 'Card not found.' })
    }

    return res.json({ data: card })
  } catch (err) {
    return next(err)
  }
}

const getBoardCardTaskCounts = async (req, res, next) => {
  try {
    const taskCounts = await cardService.getTaskCountsForBoard(req.params.boardId, req.user.id)

    if (!taskCounts) {
      return res.status(404).json({ error: 'Board not found.' })
    }

    return res.json({ data: taskCounts })
  } catch (err) {
    return next(err)
  }
}

const createBoardCard = async (req, res, next) => {
  const { title, description, label, listId, position } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Card title is required.' })
  }

  try {
    const card = await cardService.createCardForBoard(req.params.boardId, req.user.id, {
      description,
      label,
      listId,
      position,
      title: title.trim(),
    })

    if (!card) {
      return res.status(404).json({ error: 'Board not found.' })
    }

    await emitCardsChanged(req.params.boardId, req.user.id)

    return res.status(201).json({ data: card })
  } catch (err) {
    return next(err)
  }
}

const updateBoardCard = async (req, res, next) => {
  const { title, description, label, listId, position } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Card title is required.' })
  }

  try {
    const card = await cardService.updateCardForBoard(
      req.params.boardId,
      req.params.id,
      req.user.id,
      {
        description,
        label,
        listId,
        position,
        title: title.trim(),
      },
    )

    if (!card) {
      return res.status(404).json({ error: 'Card not found.' })
    }

    await emitCardsChanged(req.params.boardId, req.user.id)

    return res.json({ data: card })
  } catch (err) {
    return next(err)
  }
}

const updateBoardCardOrder = async (req, res, next) => {
  const { cards } = req.body

  if (!Array.isArray(cards)) {
    return res.status(400).json({ error: 'Cards must be an array.' })
  }

  try {
    const nextCards = await cardService.updateCardOrderForBoard(
      req.params.boardId,
      req.user.id,
      cards.map((card) => ({
        id: card.id,
        listId: card.listId,
        position: card.position,
      })),
    )

    if (!nextCards) {
      return res.status(404).json({ error: 'Board not found.' })
    }

    emitBoardChanged(req.params.boardId, {
      boardId: req.params.boardId,
      cards: nextCards,
      resource: 'cards',
    })

    return res.json({ data: nextCards })
  } catch (err) {
    return next(err)
  }
}

const deleteBoardCard = async (req, res, next) => {
  try {
    const card = await cardService.deleteCardForBoard(
      req.params.boardId,
      req.params.id,
      req.user.id,
    )

    if (!card) {
      return res.status(404).json({ error: 'Card not found.' })
    }

    await emitCardsChanged(req.params.boardId, req.user.id)

    return res.status(204).send()
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  createBoardCard,
  deleteBoardCard,
  getBoardCard,
  getBoardCardTaskCounts,
  getBoardCards,
  getCardsForUser,
  updateBoardCardOrder,
  updateBoardCard,
}
