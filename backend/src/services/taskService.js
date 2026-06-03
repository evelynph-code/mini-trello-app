const cardRepository = require('../repositories/cardRepository')
const taskRepository = require('../repositories/taskRepository')
const userRepository = require('../repositories/userRepository')
const boardsService = require('./boardsService')

const ensureCardAccess = async (boardId, cardId, userId) => {
  const board = await boardsService.getBoard(boardId, userId)

  if (!board) {
    return null
  }

  const card = await cardRepository.findCardById(boardId, cardId)

  return card ? { board, card } : null
}

const getTasks = async (boardId, cardId, userId) => {
  const access = await ensureCardAccess(boardId, cardId, userId)

  if (!access) {
    return null
  }

  return taskRepository.findTasksByCardId(boardId, cardId)
}

const getTask = async (boardId, cardId, taskId, userId) => {
  const access = await ensureCardAccess(boardId, cardId, userId)

  if (!access) {
    return null
  }

  return taskRepository.findTaskById(boardId, cardId, taskId)
}

const canEditTask = (task, board, userId) =>
  task.ownerId === userId ||
  task.assigneeId === userId ||
  (!task.ownerId && board.ownerId === userId)

const enrichTaskInput = async (board, userId, taskInput) => {
  const assigneeId = taskInput.assigneeId || null
  let assigneeName = ''

  if (assigneeId) {
    if (!board.memberIds?.includes(assigneeId)) {
      const error = new Error('Assignee must be a member of this board.')
      error.status = 400
      throw error
    }

    const assignee = await userRepository.findUserById(assigneeId)

    if (!assignee) {
      const error = new Error('Assignee not found.')
      error.status = 404
      throw error
    }

    assigneeName = assignee.name
  }

  return {
    ...taskInput,
    assigneeId,
    assigneeName,
    ownerId: taskInput.ownerId || userId,
  }
}

const createTask = async (boardId, cardId, userId, taskInput) => {
  const access = await ensureCardAccess(boardId, cardId, userId)

  if (!access) {
    return null
  }

  const owner = await userRepository.findUserById(userId)

  return taskRepository.createTask(
    boardId,
    cardId,
    await enrichTaskInput(access.board, userId, {
      ...taskInput,
      ownerName: owner?.name || '',
    }),
  )
}

const updateTask = async (boardId, cardId, taskId, userId, taskInput) => {
  const access = await ensureCardAccess(boardId, cardId, userId)

  if (!access) {
    return null
  }

  const task = await taskRepository.findTaskById(boardId, cardId, taskId)

  if (!task) {
    return null
  }

  if (!canEditTask(task, access.board, userId)) {
    const error = new Error('Only the task owner or assignee can edit this task.')
    error.status = 403
    throw error
  }

  return taskRepository.updateTask(
    boardId,
    cardId,
    taskId,
    await enrichTaskInput(access.board, userId, {
      ...taskInput,
      ownerId: task.ownerId || userId,
      ownerName: task.ownerName || '',
    }),
  )
}

const deleteTask = async (boardId, cardId, taskId, userId) => {
  const access = await ensureCardAccess(boardId, cardId, userId)

  if (!access) {
    return null
  }

  const task = await taskRepository.findTaskById(boardId, cardId, taskId)

  if (!task) {
    return null
  }

  if (!canEditTask(task, access.board, userId)) {
    const error = new Error('Only the task owner or assignee can delete this task.')
    error.status = 403
    throw error
  }

  await taskRepository.deleteTask(boardId, cardId, taskId)
  return task
}

module.exports = {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
}
