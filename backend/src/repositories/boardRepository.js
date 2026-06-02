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

  return {
    description: data.description || '',
    id: snapshot.id,
    lists: hydrateLists(data.lists),
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
    name: boardInput.name,
    ownerId,
    updatedAt: now,
  }

  await boardRef.set(board)

  return {
    description: board.description,
    id: boardRef.id,
    lists: board.lists,
    name: board.name,
    ownerId,
  }
}

const findBoardsByOwnerId = async (ownerId) => {
  const snapshot = await boardsCollection().where('ownerId', '==', ownerId).get()

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

const deleteBoard = async (boardId) => {
  await boardsCollection().doc(boardId).delete()
}

module.exports = {
  createBoard,
  deleteBoard,
  findBoardById,
  findBoardsByOwnerId,
  updateBoard,
}
