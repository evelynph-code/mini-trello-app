const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (response.status === 204) {
    return null
  }

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.')
  }

  return payload.data
}

export const cardApi = {
  createBoardCard: (boardId, card) =>
    request(`/boards/${boardId}/cards`, {
      method: 'POST',
      body: JSON.stringify(card),
    }),
  deleteBoardCard: (boardId, cardId) =>
    request(`/boards/${boardId}/cards/${cardId}`, {
      method: 'DELETE',
    }),
  getBoardCard: (boardId, cardId) => request(`/boards/${boardId}/cards/${cardId}`),
  getBoardCards: (boardId) => request(`/boards/${boardId}/cards`),
  getBoardCardTaskSummaries: (boardId) => request(`/boards/${boardId}/cards/task-counts`),
  getCards: () => request('/cards'),
  updateBoardCardOrder: (boardId, cards) =>
    request(`/boards/${boardId}/cards/order`, {
      method: 'PUT',
      body: JSON.stringify({ cards }),
    }),
  updateBoardCard: (boardId, cardId, card) =>
    request(`/boards/${boardId}/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(card),
    }),
}
