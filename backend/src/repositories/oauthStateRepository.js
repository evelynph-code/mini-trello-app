const { admin, getFirestore } = require('../config/firebase')

const oauthStatesCollection = () => getFirestore().collection('oauthStates')

const createState = async (state, maxAgeSeconds, data = {}) => {
  const now = admin.firestore.Timestamp.now()

  await oauthStatesCollection().doc(state).set({
    createdAt: now,
    expiresAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + maxAgeSeconds * 1000),
    redirectOrigin: data.redirectOrigin || '',
  })
}

const consumeState = async (state) => {
  if (!state) {
    return null
  }

  const stateRef = oauthStatesCollection().doc(state)
  const snapshot = await stateRef.get()

  if (!snapshot.exists) {
    return null
  }

  await stateRef.delete()

  const data = snapshot.data()
  const expiresAt = data.expiresAt?.toMillis?.() || 0

  if (expiresAt <= Date.now()) {
    return null
  }

  return {
    expiresAt,
    redirectOrigin: data.redirectOrigin || '',
    state,
  }
}

module.exports = {
  consumeState,
  createState,
}
