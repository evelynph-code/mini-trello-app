const userRepository = require('../repositories/userRepository')

const normalizeUsername = (username) => String(username || '').trim().toLowerCase()

const getUsers = (query) => userRepository.findUsers(query)

const getUser = (userId) => userRepository.findUserById(userId)

const updateUser = async (currentUserId, userId, userInput) => {
  if (currentUserId !== userId) {
    const error = new Error('You can only update your own account settings.')
    error.status = 403
    throw error
  }

  if (userInput.username !== undefined) {
    const nextUsername = normalizeUsername(userInput.username)

    if (!/^[a-z0-9_-]{3,24}$/.test(nextUsername)) {
      const error = new Error('Public handle must be 3-24 letters, numbers, underscores, or dashes.')
      error.status = 400
      throw error
    }

    const existingUser = await userRepository.findUserByUsername(nextUsername)

    if (existingUser && existingUser.id !== currentUserId) {
      const error = new Error('Public handle is already taken.')
      error.status = 409
      throw error
    }

    return userRepository.updateUser(userId, {
      ...userInput,
      username: nextUsername,
    })
  }

  return userRepository.updateUser(userId, userInput)
}

module.exports = {
  getUser,
  getUsers,
  updateUser,
}
