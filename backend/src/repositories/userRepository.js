const { admin, getFirestore } = require('../config/firebase')

const usersCollection = () => getFirestore().collection('users')

const serializeUser = (snapshot) => {
  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data()

  return {
    avatarUrl: data.avatarUrl || null,
    githubId: data.githubId,
    id: snapshot.id,
    initials: data.initials,
    name: data.name,
    provider: data.provider,
    role: data.role,
  }
}

const findUserById = async (userId) => {
  const snapshot = await usersCollection().doc(userId).get()

  return serializeUser(snapshot)
}

const upsertUser = async (user) => {
  const now = admin.firestore.FieldValue.serverTimestamp()
  const userRef = usersCollection().doc(user.id)

  const userRecord = {
    avatarUrl: user.avatarUrl || null,
    githubId: user.githubId,
    initials: user.initials,
    lastLoginAt: now,
    name: user.name,
    provider: 'github',
    role: user.role,
    updatedAt: now,
  }

  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef)

    transaction.set(
      userRef,
      {
        ...userRecord,
        ...(snapshot.exists ? {} : { createdAt: now }),
      },
      { merge: true },
    )
  })

  return {
    id: user.id,
    ...userRecord,
  }
}

module.exports = { findUserById, upsertUser }
