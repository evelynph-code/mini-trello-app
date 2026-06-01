const authService = require('../services/authService')

const requireAuth = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req)

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' })
    }

    req.user = user
    return next()
  } catch (err) {
    return next(err)
  }
}

module.exports = { requireAuth }
