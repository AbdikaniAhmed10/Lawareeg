import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  // Bearer tokens only — no cookie/CSRF session for the SPA
  withCredentials: false,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const { token, logout } = useAuthStore.getState()
      // Only force login when a stored session was rejected — not on public browsing.
      if (token) {
        logout()
        if (typeof window !== 'undefined') {
          const path = window.location.pathname
          const isPublic =
            path === '/' ||
            path.startsWith('/browse') ||
            path.startsWith('/listings') ||
            path.startsWith('/category') ||
            path.startsWith('/how-it-works') ||
            path.startsWith('/faq') ||
            path.startsWith('/login') ||
            path.startsWith('/register') ||
            path.startsWith('/forgot-password')
          if (!isPublic) {
            window.location.href = '/login'
          }
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
