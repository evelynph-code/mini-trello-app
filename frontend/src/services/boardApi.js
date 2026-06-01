const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.')
  }

  return payload.data
}

export const boardApi = {
  getBoard: () => request('/board'),
  createCard: (columnId, card) =>
    request(`/board/columns/${columnId}/cards`, {
      method: 'POST',
      body: JSON.stringify(card),
    }),
  moveCard: (cardId, targetColumnId) =>
    request(`/board/cards/${cardId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ targetColumnId }),
    }),
  resetBoard: () =>
    request('/board/reset', {
      method: 'POST',
    }),
}
