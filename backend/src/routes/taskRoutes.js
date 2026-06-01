const express = require('express')
const taskController = require('../controllers/taskController')
const { requireAuth } = require('../middleware/requireAuth')

const router = express.Router({ mergeParams: true })

router.use(requireAuth)
router.get('/', taskController.getTasks)
router.post('/', taskController.createTask)
router.get('/:taskId', taskController.getTask)
router.put('/:taskId', taskController.updateTask)
router.delete('/:taskId', taskController.deleteTask)

module.exports = router
