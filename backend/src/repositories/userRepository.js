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

const findUsers = async (query = '') => {
  const snapshot = await usersCollection().orderBy('name').limit(50).get()
  const normalizedQuery = query.trim().toLowerCase()
  const users = snapshot.docs.map(serializeUser)

  if (!normalizedQuery) {
    return users
  }

  return users.filter((user) =>
    [user.id, user.name, user.role]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
  )
}

const upsertUser = async (user) => {
  const now = admin.firestore.FieldValue.serverTimestamp()
  const userRef = usersCollection().doc(user.id)
  let savedUser = null

  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef)
    const existingUser = snapshot.exists ? snapshot.data() : null
    const name = existingUser?.name || user.name
    const role = existingUser?.role || user.role
    const userRecord = {
      avatarUrl: user.avatarUrl || existingUser?.avatarUrl || null,
      githubId: user.githubId,
      initials: name.slice(0, 2).toUpperCase(),
      lastLoginAt: now,
      name,
      provider: 'github',
      role,
      updatedAt: now,
    }

    transaction.set(
      userRef,
      {
        ...userRecord,
        ...(snapshot.exists ? {} : { createdAt: now }),
      },
      { merge: true },
    )

    savedUser = {
      id: user.id,
      ...userRecord,
    }
  })

  return savedUser
}

const updateUser = async (userId, userInput) => {
  const userRef = usersCollection().doc(userId)
  const snapshot = await userRef.get()

  if (!snapshot.exists) {
    return null
  }

  const update = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  if (userInput.name) {
    update.name = userInput.name
    update.initials = userInput.name.slice(0, 2).toUpperCase()
  }

  if (userInput.role) {
    update.role = userInput.role
  }

  await userRef.update(update)

  return findUserById(userId)
}

module.exports = { findUserById, findUsers, updateUser, upsertUser }
