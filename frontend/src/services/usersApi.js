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
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.')
  }

  return payload.data
}

export const usersApi = {
  getUser: (userId) => request(`/users/${userId}`),
  getUsers: (query = '') => request(`/users${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  updateUser: (userId, user) =>
    request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(user),
    }),
}
