const { emitBoardChanged } = require('../realtime/socket')
const boardsService = require('../services/boardsService')

const validateBoardInput = (body) => {
  if (!body.name || !body.name.trim()) {
    return 'Board name is required.'
  }

  return null
}

const getBoards = async (req, res, next) => {
  try {
    res.json({ data: await boardsService.getBoards(req.user.id) })
  } catch (err) {
    next(err)
  }
}

const getBoard = async (req, res, next) => {
  try {
    const board = await boardsService.getBoard(req.params.id, req.user.id)

    if (!board) {
      return res.status(404).json({ error: 'Board not found.' })
    }

    emitBoardChanged(req.params.id, {
      board,
      boardId: req.params.id,
      resource: 'board',
    })

    return res.json({ data: board })
  } catch (err) {
    return next(err)
  }
}

const createBoard = async (req, res, next) => {
  const validationError = validateBoardInput(req.body)

  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  try {
    const board = await boardsService.createBoard(req.user.id, {
      description: req.body.description,
      name: req.body.name.trim(),
    })

    return res.status(201).json({ data: board })
  } catch (err) {
    return next(err)
  }
}

const updateBoard = async (req, res, next) => {
  const validationError = validateBoardInput(req.body)

  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  try {
    const board = await boardsService.updateBoard(req.params.id, req.user.id, {
      description: req.body.description,
      lists: req.body.lists,
      name: req.body.name.trim(),
    })

    if (!board) {
      return res.status(404).json({ error: 'Board not found.' })
    }

    return res.json({ data: board })
  } catch (err) {
    return next(err)
  }
}

const deleteBoard = async (req, res, next) => {
  try {
    const board = await boardsService.deleteBoard(req.params.id, req.user.id)

    if (!board) {
      return res.status(404).json({ error: 'Board not found.' })
    }

    return res.status(204).send()
  } catch (err) {
    return next(err)
  }
}

const inviteBoardMember = async (req, res, next) => {
  const identifier = String(req.body.identifier || '').trim()

  if (!identifier) {
    return res.status(400).json({ error: 'User ID, username, or email is required.' })
  }

  try {
    const result = await boardsService.inviteBoardMember(req.params.id, req.user, identifier)

    if (!result) {
      return res.status(404).json({ error: 'Board not found.' })
    }

    emitBoardChanged(req.params.id, {
      boardId: req.params.id,
      invitation: result.invitation,
      resource: 'invitations',
    })

    return res.status(201).json({ data: result })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  createBoard,
  deleteBoard,
  getBoard,
  getBoards,
  inviteBoardMember,
  updateBoard,
}
