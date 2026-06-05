const boardRepository = require('../repositories/boardRepository')
const invitationRepository = require('../repositories/invitationRepository')

const getPendingInvitations = (userId) =>
  invitationRepository.findPendingInvitationsByUserId(userId)

const respondToInvitation = async (invitationId, userId, status) => {
  const invitation = await invitationRepository.findInvitationById(invitationId)

  if (!invitation || invitation.inviteeId !== userId || invitation.status !== 'pending') {
    return null
  }

  if (status === 'accepted') {
    await boardRepository.addBoardMember(invitation.boardId, userId)
  }

  await invitationRepository.deleteInvitation(invitationId)

  return {
    ...invitation,
    status,
  }
}

module.exports = {
  getPendingInvitations,
  respondToInvitation,
}
