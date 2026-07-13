import apiClient from './client'

export const usersApi = {
  profile: (id) => apiClient.get(`/users/${id}`).then((r) => r.data),
  topSellers: () => apiClient.get('/sellers/top').then((r) => r.data),
}

export default usersApi
