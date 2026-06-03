const express = require('express')
const cardController = require('../controllers/cardController')
const { requireAuth } = require('../middleware/requireAuth')
const { requireVerifiedEmail } = require('../middleware/requireVerifiedEmail')

const router = express.Router()

router.use(requireAuth, requireVerifiedEmail)
router.get('/', cardController.getCardsForUser)

module.exports = router
