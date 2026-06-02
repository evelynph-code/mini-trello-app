const express = require('express')
const authController = require('../controllers/authController')

const router = express.Router()

router.get('/me', authController.getCurrentUser)
router.patch('/me', authController.updateCurrentUser)
router.get('/github', authController.redirectToGitHub)
router.get('/github/callback', authController.handleGitHubCallback)
router.post('/logout', authController.logout)

module.exports = router
