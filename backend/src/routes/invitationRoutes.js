const express = require('express')
const invitationController = require('../controllers/invitationController')
const { requireAuth } = require('../middleware/requireAuth')
const { requireVerifiedEmail } = require('../middleware/requireVerifiedEmail')

const router = express.Router()

router.use(requireAuth, requireVerifiedEmail)
router.get('/', invitationController.getPendingInvitations)
router.patch('/:id', invitationController.respondToInvitation)

module.exports = router
