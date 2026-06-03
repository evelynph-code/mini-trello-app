const express = require('express')
const notificationController = require('../controllers/notificationController')
const { requireAuth } = require('../middleware/requireAuth')
const { requireVerifiedEmail } = require('../middleware/requireVerifiedEmail')

const router = express.Router()

router.use(requireAuth, requireVerifiedEmail)
router.get('/', notificationController.getNotifications)
router.patch('/:id/read', notificationController.markNotificationRead)

module.exports = router
