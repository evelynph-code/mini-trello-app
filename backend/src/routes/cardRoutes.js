const express = require('express')
const cardController = require('../controllers/cardController')
const { requireAuth } = require('../middleware/requireAuth')

const router = express.Router()

router.use(requireAuth)
router.get('/', cardController.getCardsForUser)

module.exports = router
