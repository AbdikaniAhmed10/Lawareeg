import apiClient from './client'

export const listingsApi = {
  browse: (params) => apiClient.get('/listings', { params }).then((r) => r.data),
  featured: () => apiClient.get('/listings/featured').then((r) => r.data),
  latest: () => apiClient.get('/listings/latest').then((r) => r.data),
  bySlug: (slug) => apiClient.get(`/listings/${slug}`).then((r) => r.data),
  byCategory: (slug, params) => apiClient.get(`/categories/${slug}/listings`, { params }).then((r) => r.data),
  categories: () => apiClient.get('/categories').then((r) => r.data),
  topSellers: () => apiClient.get('/sellers/top').then((r) => r.data),

  myListings: (params) => apiClient.get('/my/listings', { params }).then((r) => r.data),
  myListing: (id) => apiClient.get(`/my/listings/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/my/listings', payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/my/listings/${id}`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/my/listings/${id}`).then((r) => r.data),
  uploadScreenshot: (id, formData) =>
    apiClient
      .post(`/my/listings/${id}/screenshots`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  markOwnershipCodePlaced: (id) =>
    apiClient.post(`/my/listings/${id}/ownership/mark-placed`).then((r) => r.data),
  previewAsset: (payload) => apiClient.post('/assets/preview', payload).then((r) => r.data),

  favorites: () => apiClient.get('/favorites').then((r) => r.data),
  addFavorite: (listingId) => apiClient.post(`/favorites/${listingId}`).then((r) => r.data),
  removeFavorite: (listingId) => apiClient.delete(`/favorites/${listingId}`).then((r) => r.data),

  reviews: (listingId) => apiClient.get(`/listings/${listingId}/reviews`).then((r) => r.data),
  myReviews: () => apiClient.get('/my/reviews').then((r) => r.data),
  createReview: (orderId, payload) => apiClient.post(`/orders/${orderId}/review`, payload).then((r) => r.data),
}

export default listingsApi
