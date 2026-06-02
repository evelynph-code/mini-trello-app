const crypto = require('crypto')
const { env } = require('../config/env')
const userRepository = require('../repositories/userRepository')

const sessions = new Map()
const oauthStates = new Map()

const cookieNames = {
  session: 'mini_trello_session',
  state: 'mini_trello_oauth_state',
}

const createRandomToken = () => crypto.randomBytes(24).toString('hex')

const createCookie = (name, value, options = {}) => {
  const parts = [
    `${name}=${value}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${options.maxAge || 60 * 60 * 24}`,
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

const buildGitHubAuthorizeUrl = () => {
  const state = createRandomToken()
  const url = new URL('https://github.com/login/oauth/authorize')

  url.searchParams.set('client_id', env.githubClientId)
  url.searchParams.set('redirect_uri', env.githubOAuthCallbackUrl)
  url.searchParams.set('scope', 'read:user user:email')
  url.searchParams.set('state', state)

  oauthStates.set(state, Date.now())

  return {
    stateCookie: createCookie(cookieNames.state, state, { maxAge: 60 * 10 }),
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

const validateState = (req, receivedState) => {
  const storedState = getCookie(req, cookieNames.state)
  const stateCreatedAt = oauthStates.get(receivedState)
  const isExpired = stateCreatedAt && Date.now() - stateCreatedAt > 10 * 60 * 1000

  oauthStates.delete(receivedState)

  return Boolean(
    receivedState &&
      storedState &&
      storedState === receivedState &&
      stateCreatedAt &&
      !isExpired,
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

const createSession = (user) => {
  const sessionId = createRandomToken()

  sessions.set(sessionId, {
    createdAt: Date.now(),
    userId: user.id,
  })

  return {
    sessionCookie: createCookie(cookieNames.session, sessionId),
    sessionId,
  }
}

const persistUser = (user) => userRepository.upsertUser(user)

const getCurrentUser = async (req) => {
  const sessionId = getCookie(req, cookieNames.session)
  const session = sessionId ? sessions.get(sessionId) : null

  if (!session?.userId) {
    return null
  }

  return userRepository.findUserById(session.userId)
}

const clearSession = (req) => {
  const sessionId = getCookie(req, cookieNames.session)

  if (sessionId) {
    sessions.delete(sessionId)
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
  persistUser,
  validateState,
}
