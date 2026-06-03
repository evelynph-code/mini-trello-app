const requireVerifiedEmail = (req, res, next) => {
  if (req.user?.provider === 'local' && !req.user.emailVerified) {
    return res.status(403).json({
      error: 'Please verify your email before accessing your boards.',
    })
  }

  return next()
}

module.exports = { requireVerifiedEmail }
