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

const detailsPath = (boardId, cardId) => `/boards/${boardId}/cards/${cardId}/details`

export const cardDetailsApi = {
  addComment: (boardId, cardId, body) =>
    request(`${detailsPath(boardId, cardId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  getDetails: (boardId, cardId) => request(detailsPath(boardId, cardId)),
}
