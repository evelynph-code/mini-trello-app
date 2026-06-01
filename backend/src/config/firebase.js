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

const initializeFirebase = () => {
  if (admin.apps.length) {
    return admin.app()
  }

  const serviceAccountPath = resolveServiceAccountPath()

  if (!serviceAccountPath) {
    const error = new Error('Firebase service account path is not configured.')
    error.status = 500
    throw error
  }

  const serviceAccount = require(serviceAccountPath)

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
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
