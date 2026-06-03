const { admin, getFirestore } = require('../config/firebase')

const invitationsCollection = () => getFirestore().collection('boardInvitations')

const serializeInvitation = (snapshot) => {
  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data()

  return {
    boardId: data.boardId,
    boardName: data.boardName,
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
    id: snapshot.id,
    inviteeId: data.inviteeId,
    inviteeName: data.inviteeName,
    inviterId: data.inviterId,
    inviterName: data.inviterName,
    status: data.status || 'pending',
  }
}

const findPendingInvitation = async (boardId, inviteeId) => {
  const snapshot = await invitationsCollection()
    .where('boardId', '==', boardId)
    .where('inviteeId', '==', inviteeId)
    .where('status', '==', 'pending')
    .limit(1)
    .get()

  return snapshot.empty ? null : serializeInvitation(snapshot.docs[0])
}

const findPendingInvitationsByUserId = async (userId) => {
  const snapshot = await invitationsCollection()
    .where('inviteeId', '==', userId)
    .where('status', '==', 'pending')
    .get()

  return snapshot.docs.map(serializeInvitation)
}

const findInvitationById = async (invitationId) => {
  const snapshot = await invitationsCollection().doc(invitationId).get()

  return serializeInvitation(snapshot)
}

const createInvitation = async (invitationInput) => {
  const invitationRef = invitationsCollection().doc()
  const invitation = {
    boardId: invitationInput.boardId,
    boardName: invitationInput.boardName,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    inviteeId: invitationInput.inviteeId,
    inviteeName: invitationInput.inviteeName,
    inviterId: invitationInput.inviterId,
    inviterName: invitationInput.inviterName,
    status: 'pending',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  await invitationRef.set(invitation)

  return serializeInvitation(await invitationRef.get())
}

const updateInvitationStatus = async (invitationId, status) => {
  const invitationRef = invitationsCollection().doc(invitationId)

  await invitationRef.update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return serializeInvitation(await invitationRef.get())
}

module.exports = {
  createInvitation,
  findInvitationById,
  findPendingInvitation,
  findPendingInvitationsByUserId,
  updateInvitationStatus,
}
