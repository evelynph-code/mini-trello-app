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

export const invitationsApi = {
  getPendingInvitations: () => request('/invitations'),
  respondToInvitation: (invitationId, status) =>
    request(`/invitations/${invitationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}
