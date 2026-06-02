const express = require('express')
const userController = require('../controllers/userController')
const { requireAuth } = require('../middleware/requireAuth')

const router = express.Router()

router.use(requireAuth)
router.get('/', userController.getUsers)
router.get('/:id', userController.getUser)
router.patch('/:id', userController.updateUser)

module.exports = router
