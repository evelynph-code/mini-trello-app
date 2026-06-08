const path = require('path')
const admin = require('firebase-admin')
const { env } = require('./env')

const resolveServiceAccountPath = () => {
  if (!env.firebaseServiceAccountPath) {
    return null
  }

  return path.isAbsolute(env.firebaseServiceAccountPath)
    ? env.firebaseServiceAccountPath
    : path.resolve(__dirname, '../../', env.firebaseServiceAccountPath)
}

const parseServiceAccountJson = () => {
  if (!env.firebaseServiceAccountJson) {
    return null
  }

  const serviceAccount = JSON.parse(env.firebaseServiceAccountJson)

  if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
  }

  return serviceAccount
}

const initializeFirebase = () => {
  if (admin.apps.length) {
    return admin.app()
  }

  const serviceAccount = parseServiceAccountJson()
  const serviceAccountPath = resolveServiceAccountPath()

  if (!serviceAccount && !serviceAccountPath) {
    const error = new Error('Firebase service account is not configured.')
    error.status = 500
    throw error
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount || require(serviceAccountPath)),
  })
}

const getFirestore = () => {
  initializeFirebase()
  return admin.firestore()
}

module.exports = {
  admin,
  getFirestore,
}
