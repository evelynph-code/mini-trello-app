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

const readEnv = (name, fallback = '') => {
  const rawValue = process.env[name]

  if (rawValue === undefined) {
    return fallback
  }

  const value = rawValue.trim()
  const quote = value[0]

  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    return value.slice(1, -1)
  }

  return value
}

const readBooleanEnv = (name) => ['1', 'true', 'yes'].includes(readEnv(name).toLowerCase())

const clientOrigin = readEnv('CLIENT_ORIGIN', 'http://localhost:5173')
const configuredClientOrigins = parseList(readEnv('CLIENT_ORIGINS'))

const env = {
  apiBaseUrl: readEnv('API_BASE_URL', 'http://localhost:4000'),
  appEmailFrom: readEnv('APP_EMAIL_FROM', 'Mini Trello <no-reply@mini-trello.local>'),
  appName: readEnv('APP_NAME', 'Mini Trello'),
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
  cookieSameSite: readEnv('COOKIE_SAMESITE', 'Lax'),
  firebaseServiceAccountJson: readEnv('FIREBASE_SERVICE_ACCOUNT_JSON'),
  firebaseServiceAccountPath: readEnv('FIREBASE_SERVICE_ACCOUNT_PATH'),
  githubClientId: readEnv('GITHUB_CLIENT_ID'),
  githubClientSecret: readEnv('GITHUB_CLIENT_SECRET'),
  githubOAuthCallbackUrl:
    readEnv('GITHUB_OAUTH_CALLBACK_URL') ||
    'http://localhost:4000/api/auth/github/callback',
  nodeEnv: readEnv('NODE_ENV', 'development'),
  port: Number(readEnv('PORT', '4000')),
  smtpHost: readEnv('SMTP_HOST'),
  smtpPass: readEnv('SMTP_PASS'),
  smtpPort: Number(readEnv('SMTP_PORT', '587')),
  smtpSecure: readBooleanEnv('SMTP_SECURE'),
  smtpUser: readEnv('SMTP_USER'),
}

module.exports = { env }
