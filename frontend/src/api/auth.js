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
  verifyEmailCode: (code) => apiClient.post('/auth/email/verify-code', { code }).then((r) => r.data),
}

export default authApi
