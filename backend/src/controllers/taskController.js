const { emitBoardChanged, emitTasksChanged } = require('../realtime/socket')
const taskService = require('../services/taskService')

const allowedPriorities = ['low', 'medium', 'high', 'urgent']
const allowedStatuses = ['icebox', 'backlog', 'on-going', 'waiting-review', 'done']

const emitTaskEvents = async (boardId, cardId, userId) => {
  const tasks = await taskService.getTasks(boardId, cardId, userId)

  emitTasksChanged(boardId, cardId, {
    boardId,
    cardId,
    tasks,
  })
  emitBoardChanged(boardId, {
    boardId,
    cardId,
    resource: 'tasks',
    tasks,
  })
}

const validateTaskInput = (body) => {
  if (!body.title || !body.title.trim()) {
    return 'Task title is required.'
  }

  if (body.priority && !allowedPriorities.includes(body.priority)) {
    return 'Task priority is invalid.'
  }

  if (body.status && !allowedStatuses.includes(body.status)) {
    return 'Task status is invalid.'
  }

  return null
}

const buildTaskInput = (body) => ({
  assigneeId: body.assigneeId,
  deadline: body.deadline,
  description: body.description,
  priority: body.priority,
  status: body.status,
  title: body.title.trim(),
})

const getTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getTasks(
      req.params.boardId,
      req.params.cardId,
      req.user.id,
    )

    if (!tasks) {
      return res.status(404).json({ error: 'Card not found.' })
    }

    return res.json({ data: tasks })
  } catch (err) {
    return next(err)
  }
}

const getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTask(
      req.params.boardId,
      req.params.cardId,
      req.params.taskId,
      req.user.id,
    )

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' })
    }

    return res.json({ data: task })
  } catch (err) {
    return next(err)
  }
}

const createTask = async (req, res, next) => {
  const validationError = validateTaskInput(req.body)

  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  try {
    const task = await taskService.createTask(
      req.params.boardId,
      req.params.cardId,
      req.user.id,
      buildTaskInput(req.body),
    )

    if (!task) {
      return res.status(404).json({ error: 'Card not found.' })
    }

    await emitTaskEvents(req.params.boardId, req.params.cardId, req.user.id)

    return res.status(201).json({ data: task })
  } catch (err) {
    return next(err)
  }
}

const updateTask = async (req, res, next) => {
  const validationError = validateTaskInput(req.body)

  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  try {
    const task = await taskService.updateTask(
      req.params.boardId,
      req.params.cardId,
      req.params.taskId,
      req.user.id,
      buildTaskInput(req.body),
    )

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' })
    }

    await emitTaskEvents(req.params.boardId, req.params.cardId, req.user.id)

    return res.json({ data: task })
  } catch (err) {
    return next(err)
  }
}

const deleteTask = async (req, res, next) => {
  try {
    const task = await taskService.deleteTask(
      req.params.boardId,
      req.params.cardId,
      req.params.taskId,
      req.user.id,
    )

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' })
    }

    await emitTaskEvents(req.params.boardId, req.params.cardId, req.user.id)

    return res.status(204).send()
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
}
