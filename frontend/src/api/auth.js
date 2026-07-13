import apiClient from './client'

export const authApi = {
  login: (payload) => apiClient.post('/auth/login', payload).then((r) => r.data),
  register: (payload) => apiClient.post('/auth/register', payload).then((r) => r.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data),
  forgotPassword: (payload) => apiClient.post('/auth/forgot-password', payload).then((r) => r.data),
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload).then((r) => r.data),
  updateProfile: (payload) => apiClient.put('/auth/profile', payload).then((r) => r.data),
  changePassword: (payload) => apiClient.put('/auth/password', payload).then((r) => r.data),
  resendVerification: () => apiClient.post('/auth/email/resend').then((r) => r.data),
  verifyEmail: (id, hash, params) =>
    apiClient
      .get(`/auth/email/verify/${id}/${hash}`, { params: { ...params, json: 1 } })
      .then((r) => r.data),
}

export default authApi
