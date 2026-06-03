const { emitCardDetailsChanged } = require('../realtime/socket')
const cardActivityService = require('../services/cardActivityService')
const notificationService = require('../services/notificationService')

const emitCardDetails = async (boardId, cardId, userId) => {
  const details = await cardActivityService.getCardDetails(boardId, cardId, userId)

  if (!details) {
    return null
  }

  emitCardDetailsChanged(boardId, cardId, {
    boardId,
    cardId,
    ...details,
  })

  return details
}

const getCardDetails = async (req, res, next) => {
  try {
    const details = await cardActivityService.getCardDetails(
      req.params.boardId,
      req.params.cardId,
      req.user.id,
    )

    if (!details) {
      return res.status(404).json({ error: 'Card not found.' })
    }

    return res.json({ data: details })
  } catch (err) {
    return next(err)
  }
}

const createComment = async (req, res, next) => {
  const body = String(req.body.body || '').trim()

  if (!body) {
    return res.status(400).json({ error: 'Comment is required.' })
  }

  try {
    const comment = await cardActivityService.addComment(
      req.params.boardId,
      req.params.cardId,
      req.user,
      body,
    )

    if (!comment) {
      return res.status(404).json({ error: 'Card not found.' })
    }

    await cardActivityService.addActivity(req.params.boardId, req.params.cardId, req.user, {
      message: `${req.user.name || 'Someone'} commented`,
      type: 'comment',
    })
    await notificationService.notifyTaskCommentByIds({
      actor: req.user,
      boardId: req.params.boardId,
      cardId: req.params.cardId,
    })
    await emitCardDetails(req.params.boardId, req.params.cardId, req.user.id)

    return res.status(201).json({ data: comment })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  createComment,
  emitCardDetails,
  getCardDetails,
}
