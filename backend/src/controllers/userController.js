const userService = require('../services/userService')

const validateUserInput = (body) => {
  const userInput = {}

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = String(body.name || '').trim()

    if (!name) {
      return { error: 'Display name is required.' }
    }

    if (name.length > 60) {
      return { error: 'Display name must be 60 characters or fewer.' }
    }

    userInput.name = name
  }

  if (Object.prototype.hasOwnProperty.call(body, 'role')) {
    const role = String(body.role || '').trim()

    if (!role) {
      return { error: 'Role is required.' }
    }

    if (role.length > 60) {
      return { error: 'Role must be 60 characters or fewer.' }
    }

    userInput.role = role
  }

  if (Object.prototype.hasOwnProperty.call(body, 'username')) {
    const username = String(body.username || '').trim().toLowerCase()

    if (!/^[a-z0-9_-]{3,24}$/.test(username)) {
      return { error: 'Public handle must be 3-24 letters, numbers, underscores, or dashes.' }
    }

    userInput.username = username
  }

  if (Object.keys(userInput).length === 0) {
    return { error: 'No user updates provided.' }
  }

  return {
    userInput,
  }
}

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers(req.query.q || '')

    return res.json({ data: users })
  } catch (err) {
    return next(err)
  }
}

const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    return res.json({ data: user })
  } catch (err) {
    return next(err)
  }
}

const updateUser = async (req, res, next) => {
  const validation = validateUserInput(req.body)

  if (validation.error) {
    return res.status(400).json({ error: validation.error })
  }

  try {
    const user = await userService.updateUser(
      req.user.id,
      req.params.id,
      validation.userInput,
    )

    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    return res.json({ data: user })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  getUser,
  getUsers,
  updateUser,
}
