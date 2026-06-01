const cardRepository = require('../repositories/cardRepository')
const taskRepository = require('../repositories/taskRepository')
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

const createTask = async (boardId, cardId, userId, taskInput) => {
  const access = await ensureCardAccess(boardId, cardId, userId)

  if (!access) {
    return null
  }

  return taskRepository.createTask(boardId, cardId, taskInput)
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

  return taskRepository.updateTask(boardId, cardId, taskId, taskInput)
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
