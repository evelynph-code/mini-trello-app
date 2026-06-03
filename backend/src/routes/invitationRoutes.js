const express = require('express')
const invitationController = require('../controllers/invitationController')
const { requireAuth } = require('../middleware/requireAuth')

const router = express.Router()

router.use(requireAuth)
router.get('/', invitationController.getPendingInvitations)
router.patch('/:id', invitationController.respondToInvitation)

module.exports = router
