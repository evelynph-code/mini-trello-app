const { admin, getFirestore } = require('../config/firebase')

const usersCollection = () => getFirestore().collection('users')

const serializeUser = (snapshot) => {
  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data()

  return {
    avatarUrl: data.avatarUrl || null,
    email: data.email || '',
    emailVerified: Boolean(data.emailVerified),
    emailVerificationStatus: data.emailVerificationStatus || null,
    githubId: data.githubId,
    id: snapshot.id,
    initials: data.initials,
    name: data.name,
    provider: data.provider,
    role: data.role,
    username: data.username || '',
  }
}

const findUserById = async (userId) => {
  const snapshot = await usersCollection().doc(userId).get()

  return serializeUser(snapshot)
}

const findUserByEmail = async (email) => {
  const snapshot = await usersCollection().where('email', '==', email).limit(1).get()

  return snapshot.empty ? null : serializeUser(snapshot.docs[0])
}

const findUserByUsername = async (username) => {
  const snapshot = await usersCollection().where('username', '==', username).limit(1).get()

  return snapshot.empty ? null : serializeUser(snapshot.docs[0])
}

const findEmailVerificationByUserId = async (userId) => {
  const snapshot = await usersCollection().doc(userId).get()
  const data = snapshot.data() || {}

  return {
    emailVerificationCodeHash: data.emailVerificationCodeHash || '',
    emailVerificationExpiresAt: data.emailVerificationExpiresAt?.toDate?.() || null,
    user: serializeUser(snapshot),
  }
}

const findLocalUserCredentials = async (identifier) => {
  const normalizedIdentifier = identifier.toLowerCase()
  const usernameSnapshot = await usersCollection()
    .where('username', '==', normalizedIdentifier)
    .limit(1)
    .get()
  const snapshot = usernameSnapshot.empty
    ? await usersCollection().where('email', '==', normalizedIdentifier).limit(1).get()
    : usernameSnapshot

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  const data = doc.data()

  return {
    id: doc.id,
    passwordHash: data.passwordHash || '',
    passwordSalt: data.passwordSalt || '',
    user: serializeUser(doc),
  }
}

const findUserByIdentifier = async (identifier) => {
  const normalizedIdentifier = String(identifier || '').trim().toLowerCase()

  if (!normalizedIdentifier) {
    return null
  }

  const userById = await findUserById(identifier)

  if (userById) {
    return userById
  }

  return (
    (await findUserByUsername(normalizedIdentifier)) ||
    (await findUserByEmail(normalizedIdentifier)) ||
    (await findUsers(normalizedIdentifier)).find(
      (user) => user.name?.toLowerCase() === normalizedIdentifier,
    ) ||
    null
  )
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

const createLocalUser = async (userInput) => {
  const now = admin.firestore.FieldValue.serverTimestamp()
  const userRef = usersCollection().doc(userInput.id)
  const user = {
    avatarUrl: null,
    createdAt: now,
    email: userInput.email,
    emailVerified: false,
    emailVerificationStatus: 'pending',
    initials: userInput.name.slice(0, 2).toUpperCase(),
    name: userInput.name,
    passwordHash: userInput.passwordHash,
    passwordSalt: userInput.passwordSalt,
    provider: 'local',
    role: userInput.role || 'Team member',
    updatedAt: now,
    username: userInput.username,
  }

  await userRef.set(user)

  return findUserById(userInput.id)
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

const setEmailVerificationCode = async (userId, codeHash, expiresAt) => {
  await usersCollection().doc(userId).update({
    emailVerificationCodeHash: codeHash,
    emailVerificationExpiresAt: expiresAt,
    emailVerificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
    emailVerificationStatus: 'pending',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return findUserById(userId)
}

const markEmailVerified = async (userId) => {
  await usersCollection().doc(userId).update({
    emailVerificationCodeHash: admin.firestore.FieldValue.delete(),
    emailVerificationExpiresAt: admin.firestore.FieldValue.delete(),
    emailVerificationStatus: 'verified',
    emailVerified: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return findUserById(userId)
}

const deleteUser = async (userId) => {
  await usersCollection().doc(userId).delete()
}

module.exports = {
  createLocalUser,
  deleteUser,
  findLocalUserCredentials,
  findEmailVerificationByUserId,
  findUserByEmail,
  findUserById,
  findUserByIdentifier,
  findUserByUsername,
  findUsers,
  markEmailVerified,
  setEmailVerificationCode,
  updateUser,
  upsertUser,
}
