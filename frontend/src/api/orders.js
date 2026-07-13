import apiClient from './client'

export const ordersApi = {
  myOrders: (params) => apiClient.get('/my/orders', { params }).then((r) => r.data),
  detail: (id) => apiClient.get(`/orders/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/orders', payload).then((r) => r.data),
  uploadPaymentProof: (id, formData) =>
    apiClient
      .post(`/orders/${id}/payment-proof`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  markTransferring: (id) => apiClient.post(`/orders/${id}/mark-transferring`).then((r) => r.data),
  confirmReceipt: (id) => apiClient.post(`/orders/${id}/confirm-receipt`).then((r) => r.data),
  cancel: (id, payload) => apiClient.post(`/orders/${id}/cancel`, payload).then((r) => r.data),
  openDispute: (id, payload) => apiClient.post(`/orders/${id}/dispute`, payload).then((r) => r.data),
  timeline: (id) => apiClient.get(`/orders/${id}/timeline`).then((r) => r.data),
}

export default ordersApi
