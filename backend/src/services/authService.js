const crypto = require('crypto')
const { promisify } = require('util')
const { env } = require('../config/env')
const oauthStateRepository = require('../repositories/oauthStateRepository')
const sessionRepository = require('../repositories/sessionRepository')
const userRepository = require('../repositories/userRepository')

const scryptAsync = promisify(crypto.scrypt)
const oauthStateMaxAgeSeconds = 60 * 10
const sessionMaxAgeSeconds = 60 * 60 * 24

const cookieNames = {
  session: 'mini_trello_session',
  state: 'mini_trello_oauth_state',
}

const createRandomToken = () => crypto.randomBytes(24).toString('hex')

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const normalizeUsername = (username) =>
  String(username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')

const hashPassword = async (password, salt = createRandomToken()) => {
  const derivedKey = await scryptAsync(password, salt, 64)

  return {
    hash: derivedKey.toString('hex'),
    salt,
  }
}

const verifyPassword = async (password, salt, expectedHash) => {
  if (!salt || !expectedHash) {
    return false
  }

  const { hash } = await hashPassword(password, salt)

  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'))
}

const createCookie = (name, value, options = {}) => {
  const parts = [
    `${name}=${value}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${options.maxAge || sessionMaxAgeSeconds}`,
  ]

  if (env.nodeEnv === 'production') {
    parts.push('Secure')
  }

  return parts.join('; ')
}

const clearCookie = (name) =>
  `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`

const getCookie = (req, name) => {
  const cookies = req.headers.cookie?.split('; ') || []
  const cookie = cookies.find((entry) => entry.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null
}

const buildGitHubAuthorizeUrl = async () => {
  const state = createRandomToken()
  const url = new URL('https://github.com/login/oauth/authorize')

  url.searchParams.set('client_id', env.githubClientId)
  url.searchParams.set('redirect_uri', env.githubOAuthCallbackUrl)
  url.searchParams.set('scope', 'read:user user:email')
  url.searchParams.set('state', state)

  await oauthStateRepository.createState(state, oauthStateMaxAgeSeconds)

  return {
    stateCookie: createCookie(cookieNames.state, state, { maxAge: oauthStateMaxAgeSeconds }),
    url: url.toString(),
  }
}

const assertGitHubOAuthConfigured = () => {
  if (!env.githubClientId || !env.githubClientSecret) {
    const error = new Error('GitHub OAuth is not configured.')
    error.status = 500
    throw error
  }
}

const validateState = async (req, receivedState) => {
  const storedState = getCookie(req, cookieNames.state)
  const consumedState = await oauthStateRepository.consumeState(receivedState)

  return Boolean(
    receivedState &&
      storedState &&
      storedState === receivedState &&
      consumedState,
  )
}

const exchangeCodeForToken = async (code) => {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.githubClientId,
      client_secret: env.githubClientSecret,
      code,
      redirect_uri: env.githubOAuthCallbackUrl,
    }),
  })
  const payload = await response.json()

  if (!response.ok || payload.error || !payload.access_token) {
    const error = new Error(payload.error_description || 'GitHub token exchange failed.')
    error.status = 401
    throw error
  }

  return payload.access_token
}

const fetchGitHubUser = async (accessToken) => {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'mini-trello-app',
    },
  })
  const user = await response.json()

  if (!response.ok) {
    const error = new Error(user.message || 'Unable to fetch GitHub user.')
    error.status = 401
    throw error
  }

  return {
    avatarUrl: user.avatar_url,
    githubId: user.id,
    id: `github-${user.id}`,
    initials: user.login.slice(0, 2).toUpperCase(),
    name: user.login,
    role: 'GitHub user',
  }
}

const createSession = async (user) => {
  const sessionId = createRandomToken()

  await sessionRepository.createSession(sessionId, user.id, sessionMaxAgeSeconds)

  return {
    sessionCookie: createCookie(cookieNames.session, sessionId),
    sessionId,
  }
}

const persistUser = (user) => userRepository.upsertUser(user)

const registerLocalUser = async ({ email, name, password, username }) => {
  const normalizedEmail = normalizeEmail(email)
  const normalizedUsername = normalizeUsername(username)

  if (await userRepository.findUserByEmail(normalizedEmail)) {
    const error = new Error('Email is already registered.')
    error.status = 409
    throw error
  }

  if (await userRepository.findUserByUsername(normalizedUsername)) {
    const error = new Error('Username is already taken.')
    error.status = 409
    throw error
  }

  const { hash, salt } = await hashPassword(password)

  return userRepository.createLocalUser({
    email: normalizedEmail,
    id: `local-${normalizedUsername}`,
    name,
    passwordHash: hash,
    passwordSalt: salt,
    role: 'Team member',
    username: normalizedUsername,
  })
}

const loginLocalUser = async ({ identifier, password }) => {
  const credentials = await userRepository.findLocalUserCredentials(
    String(identifier || '').trim().toLowerCase(),
  )

  if (!credentials) {
    return null
  }

  const isValidPassword = await verifyPassword(
    password,
    credentials.passwordSalt,
    credentials.passwordHash,
  )

  return isValidPassword ? credentials.user : null
}

const getCurrentUser = async (req) => {
  const sessionId = getCookie(req, cookieNames.session)
  const session = sessionId ? await sessionRepository.findSessionById(sessionId) : null

  if (!session?.userId) {
    return null
  }

  return userRepository.findUserById(session.userId)
}

const clearSession = async (req) => {
  const sessionId = getCookie(req, cookieNames.session)

  if (sessionId) {
    await sessionRepository.deleteSession(sessionId)
  }

  return clearCookie(cookieNames.session)
}

module.exports = {
  assertGitHubOAuthConfigured,
  buildGitHubAuthorizeUrl,
  clearCookie,
  clearSession,
  cookieNames,
  createSession,
  exchangeCodeForToken,
  fetchGitHubUser,
  getCurrentUser,
  loginLocalUser,
  persistUser,
  registerLocalUser,
  validateState,
}
