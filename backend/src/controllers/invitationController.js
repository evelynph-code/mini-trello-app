const invitationService = require('../services/invitationService')

const getPendingInvitations = async (req, res, next) => {
  try {
    return res.json({ data: await invitationService.getPendingInvitations(req.user.id) })
  } catch (err) {
    return next(err)
  }
}

const respondToInvitation = async (req, res, next) => {
  const status = req.body.status

  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Invitation status must be accepted or declined.' })
  }

  try {
    const invitation = await invitationService.respondToInvitation(
      req.params.id,
      req.user.id,
      status,
    )

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found.' })
    }

    return res.json({ data: invitation })
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  getPendingInvitations,
  respondToInvitation,
}
