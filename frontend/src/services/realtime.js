import { io } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

export const socket = io(SOCKET_BASE_URL, {
  autoConnect: false,
  withCredentials: true,
})
