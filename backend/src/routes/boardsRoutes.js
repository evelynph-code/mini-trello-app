const express = require('express')
const boardsController = require('../controllers/boardsController')
const { requireAuth } = require('../middleware/requireAuth')

const router = express.Router()

router.use(requireAuth)
router.get('/', boardsController.getBoards)
router.post('/', boardsController.createBoard)
router.get('/:id', boardsController.getBoard)
router.put('/:id', boardsController.updateBoard)
router.delete('/:id', boardsController.deleteBoard)

module.exports = router
