import apiClient from './client'

export const walletApi = {
  summary: () => apiClient.get('/wallet').then((r) => r.data),
  transactions: (params) => apiClient.get('/wallet/transactions', { params }).then((r) => r.data),
  withdrawals: (params) => apiClient.get('/wallet/withdrawals', { params }).then((r) => r.data),
  requestWithdrawal: (payload) => apiClient.post('/wallet/withdrawals', payload).then((r) => r.data),
  cancelWithdrawal: (id) => apiClient.post(`/wallet/withdrawals/${id}/cancel`).then((r) => r.data),

  sellerVerificationStatus: () => apiClient.get('/seller/verification').then((r) => r.data),
  submitSellerVerification: (formData) =>
    apiClient
      .post('/seller/verification', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
}

export default walletApi
