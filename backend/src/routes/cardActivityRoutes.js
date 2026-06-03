const express = require('express')
const cardActivityController = require('../controllers/cardActivityController')
const { requireAuth } = require('../middleware/requireAuth')
const { requireVerifiedEmail } = require('../middleware/requireVerifiedEmail')

const router = express.Router({ mergeParams: true })

router.use(requireAuth, requireVerifiedEmail)
router.get('/', cardActivityController.getCardDetails)
router.post('/comments', cardActivityController.createComment)

module.exports = router
