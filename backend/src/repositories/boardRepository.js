const { admin, getFirestore } = require('../config/firebase')

const boardsCollection = () => getFirestore().collection('boards')

const defaultLists = [
  { id: 'icebox', name: 'Icebox' },
  { id: 'backlog', name: 'Backlog' },
  { id: 'doing', name: 'Doing' },
  { id: 'review', name: 'Review' },
  { id: 'done', name: 'Done' },
]

const normalizeList = (list) => {
  if (list.id === 'planning' || list.name === 'Planning') {
    return { id: 'backlog', name: 'Backlog' }
  }

  return list
}

const hydrateLists = (lists = defaultLists) => {
  const normalizedLists = lists.map(normalizeList)

  return defaultLists.map((defaultList) => {
    const existingList = normalizedLists.find((list) => list.id === defaultList.id)

    return existingList || defaultList
  })
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

  await boardRef.update({
    description: boardInput.description || '',
    name: boardInput.name,
    updatedAt: now,
  })

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
