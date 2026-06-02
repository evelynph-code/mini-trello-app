export const cardType = 'board-card'
export const listType = 'board-list'

export const emptyForm = {
  description: '',
  label: 'General',
  listId: 'today',
  title: '',
}

export const normalizeListId = (listId) => listId || 'today'

export const createListId = (name, lists) => {
  const baseId = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'assignment-group'
  let nextId = baseId
  let suffix = 2

  while (lists.some((list) => list.id === nextId)) {
    nextId = `${baseId}-${suffix}`
    suffix += 1
  }

  return nextId
}

export const getListName = (lists, listId, fallbackName) =>
  lists.find((list) => list.id === normalizeListId(listId))?.name || fallbackName || 'List'

export const sortCardsByPosition = (cards) =>
  [...cards].sort((firstCard, secondCard) => {
    const firstPosition = Number.isFinite(firstCard.position) ? firstCard.position : 0
    const secondPosition = Number.isFinite(secondCard.position) ? secondCard.position : 0

    return firstPosition - secondPosition
  })

export const applyListPositions = (cards) => {
  const listIds = [...new Set(cards.map((card) => normalizeListId(card.listId)))]

  return listIds.flatMap((listId) =>
    cards
      .filter((card) => normalizeListId(card.listId) === listId)
      .map((card, index) => ({
        ...card,
        listId,
        position: index,
      })),
  )
}
