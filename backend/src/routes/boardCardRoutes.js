const express = require('express')
const cardController = require('../controllers/cardController')
const { requireAuth } = require('../middleware/requireAuth')

const router = express.Router({ mergeParams: true })

router.use(requireAuth)
router.get('/', cardController.getBoardCards)
router.post('/', cardController.createBoardCard)
router.get('/task-counts', cardController.getBoardCardTaskCounts)
router.put('/order', cardController.updateBoardCardOrder)
router.get('/:id', cardController.getBoardCard)
router.put('/:id', cardController.updateBoardCard)
router.delete('/:id', cardController.deleteBoardCard)

module.exports = router
