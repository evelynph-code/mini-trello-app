const path = require('path')
const fs = require('fs')
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
    const error = new Error(
      'Firebase service account is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.',
    )
    error.status = 500
    throw error
  }

  if (!serviceAccount && !fs.existsSync(serviceAccountPath)) {
    const error = new Error(
      `Firebase service account file was not found at ${serviceAccountPath}. On Render, set FIREBASE_SERVICE_ACCOUNT_JSON instead of FIREBASE_SERVICE_ACCOUNT_PATH.`,
    )
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
