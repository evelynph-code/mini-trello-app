const { admin, getFirestore } = require('../config/firebase')

const sessionsCollection = () => getFirestore().collection('sessions')

const createSession = async (sessionId, userId, maxAgeSeconds) => {
  const now = admin.firestore.Timestamp.now()
  const expiresAt = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + maxAgeSeconds * 1000,
  )

  await sessionsCollection().doc(sessionId).set({
    createdAt: now,
    expiresAt,
    userId,
  })

  return {
    expiresAt: expiresAt.toMillis(),
    id: sessionId,
    userId,
  }
}

const findSessionById = async (sessionId) => {
  const snapshot = await sessionsCollection().doc(sessionId).get()

  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data()
  const expiresAt = data.expiresAt?.toMillis?.() || 0

  if (!data.userId || expiresAt <= Date.now()) {
    await deleteSession(sessionId)
    return null
  }

  return {
    expiresAt,
    id: snapshot.id,
    userId: data.userId,
  }
}

const deleteSession = async (sessionId) => {
  await sessionsCollection().doc(sessionId).delete()
}

module.exports = {
  createSession,
  deleteSession,
  findSessionById,
}
