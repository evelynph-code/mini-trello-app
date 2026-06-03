const { admin, getFirestore } = require('../config/firebase')

const tasksCollection = (boardId, cardId) =>
  getFirestore()
    .collection('boards')
    .doc(boardId)
    .collection('cards')
    .doc(cardId)
    .collection('tasks')

const serializeTask = (snapshot) => {
  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data()

  return {
    assigneeId: data.assigneeId || null,
    assigneeName: data.assigneeName || '',
    deadline: data.deadline || '',
    description: data.description || '',
    id: snapshot.id,
    ownerId: data.ownerId || null,
    ownerName: data.ownerName || '',
    priority: data.priority || 'medium',
    status: data.status || 'icebox',
    title: data.title,
  }
}

const findTasksByCardId = async (boardId, cardId) => {
  const snapshot = await tasksCollection(boardId, cardId).get()

  return snapshot.docs.map(serializeTask)
}

const findTaskById = async (boardId, cardId, taskId) => {
  const snapshot = await tasksCollection(boardId, cardId).doc(taskId).get()

  return serializeTask(snapshot)
}

const countRemainingTasksByCardId = async (boardId, cardIds) => {
  const countEntries = await Promise.all(
    cardIds.map(async (cardId) => {
      const snapshot = await tasksCollection(boardId, cardId).get()
      const remainingCount = snapshot.docs.filter((doc) => doc.data().status !== 'done').length

      return [cardId, remainingCount]
    }),
  )

  return Object.fromEntries(countEntries)
}

const findTasksByAssigneeAcrossCards = async (boardId, cardIds, assigneeId) => {
  const taskGroups = await Promise.all(
    cardIds.map(async (cardId) => {
      const snapshot = await tasksCollection(boardId, cardId)
        .where('assigneeId', '==', assigneeId)
        .get()

      return snapshot.docs.map((doc) => ({
        ...serializeTask(doc),
        boardId,
        cardId,
      }))
    }),
  )

  return taskGroups.flat()
}

const createTask = async (boardId, cardId, taskInput) => {
  const now = admin.firestore.FieldValue.serverTimestamp()
  const taskRef = tasksCollection(boardId, cardId).doc()
  const task = {
    assigneeId: taskInput.assigneeId || null,
    assigneeName: taskInput.assigneeName || '',
    createdAt: now,
    deadline: taskInput.deadline || '',
    description: taskInput.description || '',
    ownerId: taskInput.ownerId,
    ownerName: taskInput.ownerName,
    priority: taskInput.priority || 'medium',
    status: taskInput.status || 'icebox',
    title: taskInput.title,
    updatedAt: now,
  }

  await taskRef.set(task)

  return {
    assigneeId: task.assigneeId,
    assigneeName: task.assigneeName,
    deadline: task.deadline,
    description: task.description,
    id: taskRef.id,
    ownerId: task.ownerId,
    ownerName: task.ownerName,
    priority: task.priority,
    status: task.status,
    title: task.title,
  }
}

const updateTask = async (boardId, cardId, taskId, taskInput) => {
  const taskRef = tasksCollection(boardId, cardId).doc(taskId)
  const now = admin.firestore.FieldValue.serverTimestamp()

  await taskRef.update({
    assigneeId: taskInput.assigneeId || null,
    assigneeName: taskInput.assigneeName || '',
    deadline: taskInput.deadline || '',
    description: taskInput.description || '',
    ownerId: taskInput.ownerId,
    ownerName: taskInput.ownerName || '',
    priority: taskInput.priority || 'medium',
    status: taskInput.status || 'icebox',
    title: taskInput.title,
    updatedAt: now,
  })

  return findTaskById(boardId, cardId, taskId)
}

const deleteTask = async (boardId, cardId, taskId) => {
  await tasksCollection(boardId, cardId).doc(taskId).delete()
}

const deleteTasksByOwnerId = async (ownerId) => {
  const snapshot = await getFirestore()
    .collectionGroup('tasks')
    .where('ownerId', '==', ownerId)
    .get()

  if (snapshot.empty) {
    return 0
  }

  const batchSize = 450

  for (let index = 0; index < snapshot.docs.length; index += batchSize) {
    const batch = getFirestore().batch()

    snapshot.docs.slice(index, index + batchSize).forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
  }

  return snapshot.size
}

module.exports = {
  countRemainingTasksByCardId,
  createTask,
  deleteTask,
  deleteTasksByOwnerId,
  findTaskById,
  findTasksByAssigneeAcrossCards,
  findTasksByCardId,
  updateTask,
}
