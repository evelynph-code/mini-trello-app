const { admin, getFirestore } = require('../config/firebase')

const boardsCollection = () => getFirestore().collection('boards')

const defaultLists = [
  { id: 'today', name: 'Today' },
  { id: 'tomorrow', name: 'Tomorrow' },
  { id: 'this-week', name: 'This Week' },
  { id: 'later', name: 'Later' },
]

const normalizeList = (list) => {
  return {
    id: list.id || 'list',
    name: list.name || 'List',
  }
}

const hydrateLists = (lists = defaultLists) => {
  const normalizedLists = lists.map(normalizeList)

  return normalizedLists.filter(
    (list, index) => normalizedLists.findIndex((item) => item.id === list.id) === index,
  )
}

const sanitizeLists = (lists) => {
  if (!Array.isArray(lists)) {
    return defaultLists
  }

  const cleanedLists = lists
    .map((list) => ({
      id: String(list.id || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, ''),
      name: String(list.name || '').trim(),
    }))
    .filter((list) => list.id && list.name)

  if (cleanedLists.length === 0) {
    return defaultLists
  }

  return cleanedLists.filter(
    (list, index) => cleanedLists.findIndex((item) => item.id === list.id) === index,
  )
}

const serializeBoard = (snapshot) => {
  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data()
  const memberIds = [data.ownerId, ...(Array.isArray(data.memberIds) ? data.memberIds : [])]
    .filter(Boolean)
    .filter((userId, index, userIds) => userIds.indexOf(userId) === index)

  return {
    description: data.description || '',
    id: snapshot.id,
    lists: hydrateLists(data.lists),
    memberIds,
    name: data.name,
    ownerId: data.ownerId,
  }
}

const createBoard = async (ownerId, boardInput) => {
  const now = admin.firestore.FieldValue.serverTimestamp()
  const boardRef = boardsCollection().doc()
  const board = {
    createdAt: now,
    description: boardInput.description || '',
    lists: defaultLists,
    memberIds: [ownerId],
    name: boardInput.name,
    ownerId,
    updatedAt: now,
  }

  await boardRef.set(board)

  return {
    description: board.description,
    id: boardRef.id,
    lists: board.lists,
    memberIds: board.memberIds,
    name: board.name,
    ownerId,
  }
}

const findBoardsByUserId = async (userId) => {
  const [ownedSnapshot, memberSnapshot] = await Promise.all([
    boardsCollection().where('ownerId', '==', userId).get(),
    boardsCollection().where('memberIds', 'array-contains', userId).get(),
  ])
  const boards = [...ownedSnapshot.docs, ...memberSnapshot.docs].map(serializeBoard)

  return boards.filter(
    (board, index) => boards.findIndex((item) => item.id === board.id) === index,
  )
}

const findBoardsOwnedByUserId = async (userId) => {
  const snapshot = await boardsCollection().where('ownerId', '==', userId).get()

  return snapshot.docs.map(serializeBoard)
}

const findBoardById = async (boardId) => {
  const snapshot = await boardsCollection().doc(boardId).get()

  return serializeBoard(snapshot)
}

const updateBoard = async (boardId, boardInput) => {
  const boardRef = boardsCollection().doc(boardId)
  const now = admin.firestore.FieldValue.serverTimestamp()
  const updates = {
    description: boardInput.description || '',
    name: boardInput.name,
    updatedAt: now,
  }

  if (boardInput.lists !== undefined) {
    updates.lists = sanitizeLists(boardInput.lists)
  }

  await boardRef.update(updates)

  const snapshot = await boardRef.get()
  return serializeBoard(snapshot)
}

const addBoardMember = async (boardId, userId) => {
  const boardRef = boardsCollection().doc(boardId)

  await boardRef.update({
    memberIds: admin.firestore.FieldValue.arrayUnion(userId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return findBoardById(boardId)
}

const deleteBoard = async (boardId) => {
  await boardsCollection().doc(boardId).delete()
}

const deleteSnapshotDocs = async (snapshot) => {
  if (snapshot.empty) {
    return
  }

  const batchSize = 450

  for (let index = 0; index < snapshot.docs.length; index += batchSize) {
    const batch = getFirestore().batch()

    snapshot.docs.slice(index, index + batchSize).forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
  }
}

const deleteCardSubcollections = async (cardRef) => {
  const [tasksSnapshot, commentsSnapshot, activitiesSnapshot] = await Promise.all([
    cardRef.collection('tasks').get(),
    cardRef.collection('comments').get(),
    cardRef.collection('activities').get(),
  ])

  await Promise.all([
    deleteSnapshotDocs(tasksSnapshot),
    deleteSnapshotDocs(commentsSnapshot),
    deleteSnapshotDocs(activitiesSnapshot),
  ])
}

const deleteBoardCascade = async (boardId) => {
  const boardRef = boardsCollection().doc(boardId)
  const cardsSnapshot = await boardRef.collection('cards').get()

  await Promise.all(cardsSnapshot.docs.map((cardDoc) => deleteCardSubcollections(cardDoc.ref)))
  await deleteSnapshotDocs(cardsSnapshot)
  await boardRef.delete()
}

const deleteBoardsOwnedByUserId = async (userId) => {
  const boards = await findBoardsOwnedByUserId(userId)

  await Promise.all(boards.map((board) => deleteBoardCascade(board.id)))

  return boards.length
}

module.exports = {
  addBoardMember,
  createBoard,
  deleteBoard,
  deleteBoardCascade,
  deleteBoardsOwnedByUserId,
  findBoardById,
  findBoardsOwnedByUserId,
  findBoardsByUserId,
  updateBoard,
}
