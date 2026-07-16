import apiClient from './client'

// Use /session/* (not /auth/*) — some Chrome ad-blockers block URLs containing "auth".
export const authApi = {
  login: (payload) => apiClient.post('/session/login', payload).then((r) => r.data),
  register: (payload) => apiClient.post('/session/register', payload).then((r) => r.data),
  logout: () => apiClient.post('/session/logout').then((r) => r.data),
  me: () => apiClient.get('/session/me').then((r) => r.data),
  forgotPassword: (payload) => apiClient.post('/session/forgot-password', payload).then((r) => r.data),
  resetPassword: (payload) => apiClient.post('/session/reset-password', payload).then((r) => r.data),
  updateProfile: (payload) => apiClient.put('/session/profile', payload).then((r) => r.data),
  changePassword: (payload) => apiClient.put('/session/password', payload).then((r) => r.data),
  resendVerification: () => apiClient.post('/session/email/resend').then((r) => r.data),
  verifyEmailCode: (code) => apiClient.post('/session/email/verify-code', { code }).then((r) => r.data),
}

export default authApi
