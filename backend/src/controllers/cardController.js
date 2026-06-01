const cardService = require('../services/cardService')

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

const createBoardCard = async (req, res, next) => {
  const { title, description, label, listId } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Card title is required.' })
  }

  try {
    const card = await cardService.createCardForBoard(req.params.boardId, req.user.id, {
      description,
      label,
      listId,
      title: title.trim(),
    })

    if (!card) {
      return res.status(404).json({ error: 'Board not found.' })
    }

    return res.status(201).json({ data: card })
  } catch (err) {
    return next(err)
  }
}

const updateBoardCard = async (req, res, next) => {
  const { title, description, label, listId } = req.body

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
        title: title.trim(),
      },
    )

    if (!card) {
      return res.status(404).json({ error: 'Card not found.' })
    }

    return res.json({ data: card })
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

    return res.status(204).send()
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  createBoardCard,
  deleteBoardCard,
  getBoardCard,
  getBoardCards,
  getCardsForUser,
  updateBoardCard,
}
