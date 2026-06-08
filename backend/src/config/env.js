const path = require('path')

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
})

const parseList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const configuredClientOrigins = parseList(process.env.CLIENT_ORIGINS)

const env = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  appEmailFrom: process.env.APP_EMAIL_FROM || 'Mini Trello <no-reply@mini-trello.local>',
  appName: process.env.APP_NAME || 'Mini Trello',
  clientOrigin,
  clientOrigins: [
    ...new Set([
      clientOrigin,
      ...configuredClientOrigins,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ]),
  ],
  cookieSameSite: process.env.COOKIE_SAMESITE || 'Lax',
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  githubOAuthCallbackUrl:
    process.env.GITHUB_OAUTH_CALLBACK_URL ||
    'http://localhost:4000/api/auth/github/callback',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
}

module.exports = { env }
