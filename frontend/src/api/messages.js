import apiClient from './client'

export const messagesApi = {
  conversations: () => apiClient.get('/conversations').then((r) => r.data),
  conversation: (id) => apiClient.get(`/conversations/${id}`).then((r) => r.data),
  messages: (id, params) => apiClient.get(`/conversations/${id}/messages`, { params }).then((r) => r.data),
  send: (id, payload) => apiClient.post(`/conversations/${id}/messages`, payload).then((r) => r.data),
  start: (payload) => apiClient.post('/conversations', payload).then((r) => r.data),
  startSupport: () => apiClient.post('/conversations/support').then((r) => r.data),
  markRead: (id) => apiClient.post(`/conversations/${id}/read`).then((r) => r.data),

  notifications: (params) => apiClient.get('/notifications', { params }).then((r) => r.data),
  markNotificationRead: (id) => apiClient.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () => apiClient.post('/notifications/read-all').then((r) => r.data),
}

export default messagesApi
