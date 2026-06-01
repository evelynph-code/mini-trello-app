const express = require('express')
const boardController = require('../controllers/boardController')

const router = express.Router()

router.get('/', boardController.getBoard)
router.post('/columns/:columnId/cards', boardController.createCard)
router.patch('/cards/:cardId/move', boardController.moveCard)
router.post('/reset', boardController.resetBoard)

module.exports = router
