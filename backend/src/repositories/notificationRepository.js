const { getFirestore } = require('../config/firebase')

const notificationsCollection = () => getFirestore().collection('notifications')

const serializeNotification = (snapshot) => {
  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data()

  return {
    boardId: data.boardId || null,
    boardName: data.boardName || '',
    cardId: data.cardId || null,
    cardTitle: data.cardTitle || '',
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
    id: snapshot.id,
    message: data.message || '',
    status: data.status || 'unread',
    taskId: data.taskId || null,
    taskTitle: data.taskTitle || '',
    title: data.title || '',
    type: data.type || 'notification',
    userId: data.userId,
  }
}

const createNotification = async (notificationInput) => {
  const notificationRef = notificationsCollection().doc()

  await notificationRef.set({
    ...notificationInput,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'unread',
  })

  return serializeNotification(await notificationRef.get())
}

const createNotifications = async (notifications) => {
  const createdNotifications = await Promise.all(
    notifications.map((notification) => createNotification(notification)),
  )

  return createdNotifications
}

const findUnreadNotificationsByUserId = async (userId) => {
  const snapshot = await notificationsCollection()
    .where('userId', '==', userId)
    .where('status', '==', 'unread')
    .get()

  return snapshot.docs.map(serializeNotification)
}

const deleteNotificationForUser = async (notificationId, userId) => {
  const notificationRef = notificationsCollection().doc(notificationId)
  const snapshot = await notificationRef.get()

  if (!snapshot.exists || snapshot.data().userId !== userId) {
    return null
  }

  const notification = serializeNotification(snapshot)

  await notificationRef.delete()

  return notification
}

module.exports = {
  createNotification,
  createNotifications,
  deleteNotificationForUser,
  findUnreadNotificationsByUserId,
}
