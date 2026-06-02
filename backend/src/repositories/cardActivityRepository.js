const { admin, getFirestore } = require('../config/firebase')

const cardRef = (boardId, cardId) =>
  getFirestore().collection('boards').doc(boardId).collection('cards').doc(cardId)

const activitiesCollection = (boardId, cardId) =>
  cardRef(boardId, cardId).collection('activities')

const commentsCollection = (boardId, cardId) =>
  cardRef(boardId, cardId).collection('comments')

const serializeEntry = (snapshot) => {
  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data()

  return {
    authorId: data.authorId,
    authorName: data.authorName || 'Someone',
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
    id: snapshot.id,
    message: data.message || '',
    taskId: data.taskId || null,
    taskTitle: data.taskTitle || '',
    type: data.type || 'activity',
  }
}

const serializeComment = (snapshot) => {
  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data()

  return {
    authorId: data.authorId,
    authorName: data.authorName || 'Someone',
    body: data.body || '',
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
    id: snapshot.id,
  }
}

const findActivitiesByCardId = async (boardId, cardId) => {
  const snapshot = await activitiesCollection(boardId, cardId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()

  return snapshot.docs.map(serializeEntry)
}

const findCommentsByCardId = async (boardId, cardId) => {
  const snapshot = await commentsCollection(boardId, cardId)
    .orderBy('createdAt', 'asc')
    .limit(100)
    .get()

  return snapshot.docs.map(serializeComment)
}

const createActivity = async (boardId, cardId, activityInput) => {
  const activityRef = activitiesCollection(boardId, cardId).doc()
  const activity = {
    authorId: activityInput.authorId,
    authorName: activityInput.authorName,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    message: activityInput.message,
    taskId: activityInput.taskId || null,
    taskTitle: activityInput.taskTitle || '',
    type: activityInput.type || 'activity',
  }

  await activityRef.set(activity)

  return serializeEntry(await activityRef.get())
}

const createComment = async (boardId, cardId, commentInput) => {
  const commentRef = commentsCollection(boardId, cardId).doc()
  const comment = {
    authorId: commentInput.authorId,
    authorName: commentInput.authorName,
    body: commentInput.body,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  await commentRef.set(comment)

  return serializeComment(await commentRef.get())
}

module.exports = {
  createActivity,
  createComment,
  findActivitiesByCardId,
  findCommentsByCardId,
}
