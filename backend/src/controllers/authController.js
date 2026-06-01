const { env } = require('../config/env')
const authService = require('../services/authService')

const getCurrentUser = (req, res) => {
  const user = authService.getCurrentUser(req)

  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }

  return res.json({ data: user })
}

const redirectToGitHub = (_req, res, next) => {
  try {
    authService.assertGitHubOAuthConfigured()

    const { stateCookie, url } = authService.buildGitHubAuthorizeUrl()

    res.setHeader('Set-Cookie', stateCookie)
    return res.redirect(url)
  } catch (err) {
    return next(err)
  }
}

const handleGitHubCallback = async (req, res, next) => {
  const { code, state } = req.query

  try {
    if (!code || !authService.validateState(req, state)) {
      return res.redirect(`${env.clientOrigin}/?auth=github_failed`)
    }

    const accessToken = await authService.exchangeCodeForToken(code)
    const user = await authService.fetchGitHubUser(accessToken)
    const { sessionCookie } = authService.createSession(user)

    res.setHeader('Set-Cookie', [
      sessionCookie,
      authService.clearCookie(authService.cookieNames.state),
    ])

    return res.redirect(`${env.clientOrigin}/?auth=github_success`)
  } catch (err) {
    return next(err)
  }
}

const logout = (req, res) => {
  res.setHeader('Set-Cookie', authService.clearSession(req))
  res.json({ data: { success: true } })
}

module.exports = {
  getCurrentUser,
  handleGitHubCallback,
  logout,
  redirectToGitHub,
}
