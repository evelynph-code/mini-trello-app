const { env } = require('../config/env')
const authService = require('../services/authService')
const userService = require('../services/userService')

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req)

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' })
    }

    return res.json({ data: user })
  } catch (err) {
    return next(err)
  }
}

const validateLocalAuthInput = (body, mode) => {
  const email = String(body.email || '').trim()
  const identifier = String(body.identifier || body.username || body.email || '').trim()
  const name = String(body.name || '').trim()
  const password = String(body.password || '')
  const username = String(body.username || '').trim()

  if (mode === 'register') {
    if (!name || name.length > 60) {
      return { error: 'Display name is required and must be 60 characters or fewer.' }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: 'A valid email is required.' }
    }

    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(username)) {
      return { error: 'Username must be 3-24 letters, numbers, underscores, or dashes.' }
    }
  } else if (!identifier) {
    return { error: 'Username or email is required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  return {
    input: {
      email,
      identifier,
      name,
      password,
      username,
    },
  }
}

const register = async (req, res, next) => {
  const validation = validateLocalAuthInput(req.body, 'register')

  if (validation.error) {
    return res.status(400).json({ error: validation.error })
  }

  try {
    const user = await authService.registerLocalUser(validation.input)
    const { sessionCookie } = await authService.createSession(user)

    res.setHeader('Set-Cookie', sessionCookie)

    return res.status(201).json({
      data: {
        user,
        verification: {
          message: 'Email verification is pending. Nodemailer will send this later.',
          status: user.emailVerificationStatus,
        },
      },
    })
  } catch (err) {
    return next(err)
  }
}

const login = async (req, res, next) => {
  const validation = validateLocalAuthInput(req.body, 'login')

  if (validation.error) {
    return res.status(400).json({ error: validation.error })
  }

  try {
    const user = await authService.loginLocalUser(validation.input)

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' })
    }

    const { sessionCookie } = await authService.createSession(user)

    res.setHeader('Set-Cookie', sessionCookie)

    return res.json({ data: user })
  } catch (err) {
    return next(err)
  }
}

const updateCurrentUser = async (req, res, next) => {
  const name = String(req.body.name || '').trim()

  if (!name) {
    return res.status(400).json({ error: 'Display name is required.' })
  }

  if (name.length > 60) {
    return res.status(400).json({ error: 'Display name must be 60 characters or fewer.' })
  }

  try {
    const currentUser = await authService.getCurrentUser(req)

    if (!currentUser) {
      return res.status(401).json({ error: 'Not authenticated.' })
    }

    const user = await userService.updateUser(currentUser.id, currentUser.id, { name })

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' })
    }

    return res.json({ data: user })
  } catch (err) {
    return next(err)
  }
}

const redirectToGitHub = async (_req, res, next) => {
  try {
    authService.assertGitHubOAuthConfigured()

    const { stateCookie, url } = await authService.buildGitHubAuthorizeUrl()

    res.setHeader('Set-Cookie', stateCookie)
    return res.redirect(url)
  } catch (err) {
    return next(err)
  }
}

const handleGitHubCallback = async (req, res, next) => {
  const { code, state } = req.query

  try {
    if (!code || !(await authService.validateState(req, state))) {
      return res.redirect(`${env.clientOrigin}/?auth=github_failed`)
    }

    const accessToken = await authService.exchangeCodeForToken(code)
    const user = await authService.fetchGitHubUser(accessToken)
    await authService.persistUser(user)

    const { sessionCookie } = await authService.createSession(user)

    res.setHeader('Set-Cookie', [
      sessionCookie,
      authService.clearCookie(authService.cookieNames.state),
    ])

    return res.redirect(`${env.clientOrigin}/?auth=github_success`)
  } catch (err) {
    return next(err)
  }
}

const logout = async (req, res, next) => {
  try {
    res.setHeader('Set-Cookie', await authService.clearSession(req))
    return res.json({ data: { success: true } })
  } catch (err) {
    return next(err)
  }
}

const deleteCurrentUser = async (req, res, next) => {
  try {
    const deletedUser = await authService.deleteCurrentUser(req)

    if (!deletedUser) {
      return res.status(401).json({ error: 'Not authenticated.' })
    }

    res.setHeader('Set-Cookie', await authService.clearSession(req))

    return res.json({ data: { success: true } })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  deleteCurrentUser,
  getCurrentUser,
  handleGitHubCallback,
  login,
  logout,
  redirectToGitHub,
  register,
  updateCurrentUser,
}
