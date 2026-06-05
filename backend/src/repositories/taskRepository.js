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
    reviewerId: data.reviewerId || null,
    reviewerName: data.reviewerName || '',
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

const summarizeTasksByCardId = async (boardId, cardIds) => {
  const summaryEntries = await Promise.all(
    cardIds.map(async (cardId) => {
      const snapshot = await tasksCollection(boardId, cardId).get()
      const activeTasks = snapshot.docs
        .map(serializeTask)
        .filter((task) => task && task.status !== 'done')
      const dueTasks = activeTasks
        .filter((task) => task.deadline)
        .sort((firstTask, secondTask) => firstTask.deadline.localeCompare(secondTask.deadline))

      return [
        cardId,
        {
          dueTask: dueTasks[0]
            ? {
                deadline: dueTasks[0].deadline,
                id: dueTasks[0].id,
                status: dueTasks[0].status,
                title: dueTasks[0].title,
              }
            : null,
          remainingCount: activeTasks.length,
        },
      ]
    }),
  )

  return Object.fromEntries(summaryEntries)
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
    reviewerId: taskInput.reviewerId || null,
    reviewerName: taskInput.reviewerName || '',
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
    reviewerId: task.reviewerId,
    reviewerName: task.reviewerName,
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
    reviewerId: taskInput.reviewerId || null,
    reviewerName: taskInput.reviewerName || '',
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
  createTask,
  deleteTask,
  deleteTasksByOwnerId,
  findTaskById,
  findTasksByAssigneeAcrossCards,
  findTasksByCardId,
  summarizeTasksByCardId,
  updateTask,
}
