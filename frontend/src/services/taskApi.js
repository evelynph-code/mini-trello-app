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

const taskPath = (boardId, cardId) => `/boards/${boardId}/cards/${cardId}/tasks`

export const taskApi = {
  createTask: (boardId, cardId, task) =>
    request(taskPath(boardId, cardId), {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  deleteTask: (boardId, cardId, taskId) =>
    request(`${taskPath(boardId, cardId)}/${taskId}`, {
      method: 'DELETE',
    }),
  getTasks: (boardId, cardId) => request(taskPath(boardId, cardId)),
  updateTask: (boardId, cardId, taskId, task) =>
    request(`${taskPath(boardId, cardId)}/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }),
}
