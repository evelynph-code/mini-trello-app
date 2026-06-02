const userRepository = require('../repositories/userRepository')

const getUsers = (query) => userRepository.findUsers(query)

const getUser = (userId) => userRepository.findUserById(userId)

const updateUser = async (currentUserId, userId, userInput) => {
  if (currentUserId !== userId) {
    const error = new Error('You can only update your own account settings.')
    error.status = 403
    throw error
  }

  return userRepository.updateUser(userId, userInput)
}

module.exports = {
  getUser,
  getUsers,
  updateUser,
}
