const crypto = require('crypto')
const { promisify } = require('util')
const { env } = require('../config/env')
const boardRepository = require('../repositories/boardRepository')
const oauthStateRepository = require('../repositories/oauthStateRepository')
const sessionRepository = require('../repositories/sessionRepository')
const taskRepository = require('../repositories/taskRepository')
const userRepository = require('../repositories/userRepository')
const emailService = require('./emailService')

const scryptAsync = promisify(crypto.scrypt)
const oauthStateMaxAgeSeconds = 60 * 10
const sessionMaxAgeSeconds = 60 * 60 * 24
const emailVerificationMaxAgeMs = 1000 * 60 * 15

const cookieNames = {
  session: 'mini_trello_session',
  state: 'mini_trello_oauth_state',
}

const getCookieAttributes = (options = {}) => {
  const sameSite = env.cookieSameSite
  const shouldSecure = env.nodeEnv === 'production' || sameSite.toLowerCase() === 'none'
  const parts = [
    'HttpOnly',
    'Path=/',
    `SameSite=${sameSite}`,
    `Max-Age=${options.maxAge ?? sessionMaxAgeSeconds}`,
  ]

  if (shouldSecure) {
    parts.push('Secure')
  }

  return parts
}

const createRandomToken = () => crypto.randomBytes(24).toString('hex')

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

const createVerificationCode = () => String(crypto.randomInt(100000, 1000000))

const hashVerificationCode = (userId, code) => hashToken(`${userId}:${code}`)

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
  return [
    `${name}=${value}`,
    ...getCookieAttributes(options),
  ].join('; ')
}

const clearCookie = (name) =>
  `${name}=; ${getCookieAttributes({ maxAge: 0 }).join('; ')}`

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

const sendEmailVerification = async (user) => {
  if (!user || user.provider !== 'local' || user.emailVerified) {
    return { status: user?.emailVerificationStatus || 'verified' }
  }

  const code = createVerificationCode()
  const codeHash = hashVerificationCode(user.id, code)
  const expiresAt = new Date(Date.now() + emailVerificationMaxAgeMs)
  const updatedUser = await userRepository.setEmailVerificationCode(user.id, codeHash, expiresAt)

  let delivery

  try {
    delivery = await emailService.sendVerificationEmail(updatedUser, code)
  } catch (err) {
    console.error('Unable to send verification email.', err)

    return {
      failed: true,
      message: 'Account created, but the verification email could not be sent. Check SMTP settings and resend.',
      status: updatedUser.emailVerificationStatus,
    }
  }

  return {
    ...delivery,
    message: delivery.skipped
      ? 'Email verification is pending. Configure SMTP to send verification emails.'
      : 'Verification email sent. Check your inbox.',
    status: updatedUser.emailVerificationStatus,
  }
}

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

  const user = await userRepository.createLocalUser({
    email: normalizedEmail,
    id: `local-${normalizedUsername}`,
    name,
    passwordHash: hash,
    passwordSalt: salt,
    role: 'Team member',
    username: normalizedUsername,
  })

  const verification = await sendEmailVerification(user)

  return {
    user,
    verification,
  }
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

const resendEmailVerification = async (req) => {
  const user = await getCurrentUser(req)

  if (!user) {
    const error = new Error('Not authenticated.')
    error.status = 401
    throw error
  }

  if (user.provider !== 'local') {
    const error = new Error('Only local accounts use email verification.')
    error.status = 400
    throw error
  }

  if (user.emailVerified) {
    return {
      message: 'Email is already verified.',
      status: user.emailVerificationStatus,
    }
  }

  return sendEmailVerification(user)
}

const verifyEmail = async (req, code) => {
  const user = await getCurrentUser(req)
  const normalizedCode = String(code || '').trim()

  if (!user) {
    const error = new Error('Not authenticated.')
    error.status = 401
    throw error
  }

  if (user.provider !== 'local') {
    const error = new Error('Only local accounts use email verification.')
    error.status = 400
    throw error
  }

  if (user.emailVerified) {
    return user
  }

  if (!/^\d{6}$/.test(normalizedCode)) {
    const error = new Error('A valid 6-digit verification code is required.')
    error.status = 400
    throw error
  }

  const match = await userRepository.findEmailVerificationByUserId(user.id)

  if (!match?.user || !match.emailVerificationCodeHash) {
    const error = new Error('Verification code is invalid or has already been used.')
    error.status = 400
    throw error
  }

  if (!match.emailVerificationExpiresAt || match.emailVerificationExpiresAt.getTime() < Date.now()) {
    const error = new Error('Verification code has expired.')
    error.status = 400
    throw error
  }

  const expectedHash = Buffer.from(match.emailVerificationCodeHash, 'hex')
  const codeHash = Buffer.from(hashVerificationCode(user.id, normalizedCode), 'hex')

  if (
    expectedHash.length !== codeHash.length ||
    !crypto.timingSafeEqual(expectedHash, codeHash)
  ) {
    const error = new Error('Verification code is invalid or has already been used.')
    error.status = 400
    throw error
  }

  return userRepository.markEmailVerified(match.user.id)
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

const deleteCurrentUser = async (req) => {
  const user = await getCurrentUser(req)

  if (!user) {
    return null
  }

  await taskRepository.deleteTasksByOwnerId(user.id)
  await boardRepository.deleteBoardsOwnedByUserId(user.id)
  await userRepository.deleteUser(user.id)

  return user
}

module.exports = {
  assertGitHubOAuthConfigured,
  buildGitHubAuthorizeUrl,
  clearCookie,
  clearSession,
  cookieNames,
  createSession,
  deleteCurrentUser,
  exchangeCodeForToken,
  fetchGitHubUser,
  getCurrentUser,
  loginLocalUser,
  persistUser,
  registerLocalUser,
  resendEmailVerification,
  validateState,
  verifyEmail,
}
