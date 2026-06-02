const { admin, getFirestore } = require('../config/firebase')

const cardsCollection = (boardId) =>
  getFirestore().collection('boards').doc(boardId).collection('cards')

const serializeCard = (snapshot, boardId) => {
  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data()

  return {
    assigneeId: data.assigneeId,
    boardId,
    description: data.description || '',
    id: snapshot.id,
    label: data.label || 'General',
    listId: data.listId || 'today',
    listName: data.listName || 'Today',
    position: Number.isFinite(data.position) ? data.position : 0,
    title: data.title,
  }
}

const createCard = async (boardId, cardInput) => {
  const now = admin.firestore.FieldValue.serverTimestamp()
  const cardRef = cardsCollection(boardId).doc()
  const card = {
    assigneeId: cardInput.assigneeId,
    createdAt: now,
    description: cardInput.description || '',
    label: cardInput.label || 'General',
    listId: cardInput.listId,
    listName: cardInput.listName,
    position: Number.isFinite(cardInput.position) ? cardInput.position : Date.now(),
    title: cardInput.title,
    updatedAt: now,
  }

  await cardRef.set(card)

  return {
    assigneeId: card.assigneeId,
    boardId,
    description: card.description,
    id: cardRef.id,
    label: card.label,
    listId: card.listId,
    listName: card.listName,
    position: card.position,
    title: card.title,
  }
}

const findCardsByBoardId = async (boardId) => {
  const snapshot = await cardsCollection(boardId).get()

  return snapshot.docs.map((doc) => serializeCard(doc, boardId))
}

const findCardsByAssigneeId = async (assigneeId) => {
  const snapshot = await getFirestore()
    .collectionGroup('cards')
    .where('assigneeId', '==', assigneeId)
    .get()

  return snapshot.docs.map((doc) => serializeCard(doc, doc.ref.parent.parent.id))
}

const findCardById = async (boardId, cardId) => {
  const snapshot = await cardsCollection(boardId).doc(cardId).get()

  return serializeCard(snapshot, boardId)
}

const updateCard = async (boardId, cardId, cardInput) => {
  const cardRef = cardsCollection(boardId).doc(cardId)
  const now = admin.firestore.FieldValue.serverTimestamp()

  await cardRef.update({
    description: cardInput.description || '',
    label: cardInput.label || 'General',
    listId: cardInput.listId,
    listName: cardInput.listName,
    position: Number.isFinite(cardInput.position) ? cardInput.position : 0,
    title: cardInput.title,
    updatedAt: now,
  })

  return findCardById(boardId, cardId)
}

const deleteCard = async (boardId, cardId) => {
  await cardsCollection(boardId).doc(cardId).delete()
}

module.exports = {
  createCard,
  deleteCard,
  findCardById,
  findCardsByAssigneeId,
  findCardsByBoardId,
  updateCard,
}
