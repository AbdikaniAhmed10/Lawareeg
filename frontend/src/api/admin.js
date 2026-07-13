import apiClient from './client'

export const adminApi = {
  dashboard: () => apiClient.get('/admin/dashboard').then((r) => r.data),

  users: (params) => apiClient.get('/admin/users', { params }).then((r) => r.data),
  updateUser: (id, payload) => apiClient.put(`/admin/users/${id}`, payload).then((r) => r.data),
  suspendUser: (id) => apiClient.post(`/admin/users/${id}/suspend`).then((r) => r.data),
  reinstateUser: (id) => apiClient.post(`/admin/users/${id}/reinstate`).then((r) => r.data),

  verifications: (params) => apiClient.get('/admin/verifications', { params }).then((r) => r.data),
  approveVerification: (id, payload) =>
    apiClient.post(`/admin/verifications/${id}/approve`, payload).then((r) => r.data),
  rejectVerification: (id, payload) =>
    apiClient.post(`/admin/verifications/${id}/reject`, payload).then((r) => r.data),

  listings: (params) => apiClient.get('/admin/listings', { params }).then((r) => r.data),
  approveListing: (id, payload) => apiClient.post(`/admin/listings/${id}/approve`, payload).then((r) => r.data),
  rejectListing: (id, payload) => apiClient.post(`/admin/listings/${id}/reject`, payload).then((r) => r.data),
  verifyOwnership: (id) => apiClient.post(`/admin/listings/${id}/verify-ownership`).then((r) => r.data),
  rejectOwnership: (id, payload) => apiClient.post(`/admin/listings/${id}/reject-ownership`, payload).then((r) => r.data),

  orders: (params) => apiClient.get('/admin/orders', { params }).then((r) => r.data),
  orderDetail: (id) => apiClient.get(`/admin/orders/${id}`).then((r) => r.data),
  confirmPayment: (id) => apiClient.post(`/admin/orders/${id}/confirm-payment`).then((r) => r.data),
  releaseFunds: (id) => apiClient.post(`/admin/orders/${id}/release-funds`).then((r) => r.data),
  refundOrder: (id, payload) => apiClient.post(`/admin/orders/${id}/refund`, payload).then((r) => r.data),
  resolveDispute: (id, payload) => apiClient.post(`/admin/orders/${id}/resolve-dispute`, payload).then((r) => r.data),

  withdrawals: (params) => apiClient.get('/admin/withdrawals', { params }).then((r) => r.data),
  approveWithdrawal: (id) => apiClient.post(`/admin/withdrawals/${id}/approve`).then((r) => r.data),
  rejectWithdrawal: (id, payload) => apiClient.post(`/admin/withdrawals/${id}/reject`, payload).then((r) => r.data),
  markWithdrawalPaid: (id) => apiClient.post(`/admin/withdrawals/${id}/mark-paid`).then((r) => r.data),

  categories: () => apiClient.get('/admin/categories').then((r) => r.data),
  createCategory: (payload) => apiClient.post('/admin/categories', payload).then((r) => r.data),
  updateCategory: (id, payload) => apiClient.put(`/admin/categories/${id}`, payload).then((r) => r.data),
  deleteCategory: (id) => apiClient.delete(`/admin/categories/${id}`).then((r) => r.data),

  disputes: (params) => apiClient.get('/admin/disputes', { params }).then((r) => r.data),

  support: (params) => apiClient.get('/admin/support', { params }).then((r) => r.data),

  settings: () => apiClient.get('/admin/settings').then((r) => r.data),
  updateSettings: (payload) => apiClient.put('/admin/settings', payload).then((r) => r.data),

  reports: (params) => apiClient.get('/admin/reports', { params }).then((r) => r.data),
}

export default adminApi
