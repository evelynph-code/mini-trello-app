const path = require('path')

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
})

const env = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  githubOAuthCallbackUrl:
    process.env.GITHUB_OAUTH_CALLBACK_URL ||
    'http://localhost:4000/api/auth/github/callback',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
}

module.exports = { env }
