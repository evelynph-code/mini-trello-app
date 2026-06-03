const express = require('express')
const notificationController = require('../controllers/notificationController')
const { requireAuth } = require('../middleware/requireAuth')

const router = express.Router()

router.use(requireAuth)
router.get('/', notificationController.getNotifications)
router.patch('/:id/read', notificationController.markNotificationRead)

module.exports = router
