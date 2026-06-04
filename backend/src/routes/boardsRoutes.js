const express = require('express')
const boardsController = require('../controllers/boardsController')
const { requireAuth } = require('../middleware/requireAuth')
const { requireVerifiedEmail } = require('../middleware/requireVerifiedEmail')

const router = express.Router()

router.use(requireAuth, requireVerifiedEmail)
router.get('/', boardsController.getBoards)
router.post('/', boardsController.createBoard)
router.post('/:id/invitations', boardsController.inviteBoardMember)
router.delete('/:id/members/me', boardsController.leaveBoard)
router.delete('/:id/members/:memberId', boardsController.removeBoardMember)
router.get('/:id', boardsController.getBoard)
router.put('/:id', boardsController.updateBoard)
router.delete('/:id', boardsController.deleteBoard)

module.exports = router
