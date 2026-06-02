const express = require('express')
const cardActivityController = require('../controllers/cardActivityController')
const { requireAuth } = require('../middleware/requireAuth')

const router = express.Router({ mergeParams: true })

router.use(requireAuth)
router.get('/', cardActivityController.getCardDetails)
router.post('/comments', cardActivityController.createComment)

module.exports = router
