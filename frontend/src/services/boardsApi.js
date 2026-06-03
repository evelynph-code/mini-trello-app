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

export const boardsApi = {
  inviteBoardMember: (boardId, identifier) =>
    request(`/boards/${boardId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }),
  createBoard: (board) =>
    request('/boards', {
      method: 'POST',
      body: JSON.stringify(board),
    }),
  deleteBoard: (boardId) =>
    request(`/boards/${boardId}`, {
      method: 'DELETE',
    }),
  getBoard: (boardId) => request(`/boards/${boardId}`),
  getBoards: () => request('/boards'),
  updateBoard: (boardId, board) =>
    request(`/boards/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify(board),
    }),
}
