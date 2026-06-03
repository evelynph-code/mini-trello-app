const notificationService = require('../services/notificationService')

const getNotifications = async (req, res, next) => {
  try {
    return res.json({ data: await notificationService.getNotifications(req.user.id) })
  } catch (err) {
    return next(err)
  }
}

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markNotificationRead(req.params.id, req.user.id)

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' })
    }

    return res.json({ data: notification })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
}
