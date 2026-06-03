const express = require('express')
const taskController = require('../controllers/taskController')
const { requireAuth } = require('../middleware/requireAuth')
const { requireVerifiedEmail } = require('../middleware/requireVerifiedEmail')

const router = express.Router({ mergeParams: true })

router.use(requireAuth, requireVerifiedEmail)
router.get('/', taskController.getTasks)
router.post('/', taskController.createTask)
router.get('/:taskId', taskController.getTask)
router.put('/:taskId', taskController.updateTask)
router.delete('/:taskId', taskController.deleteTask)

module.exports = router
