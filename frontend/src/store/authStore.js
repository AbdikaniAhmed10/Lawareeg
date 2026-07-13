import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      isAdmin: () => get().user?.role === 'admin',
      isSeller: () => get().user?.role === 'seller' || get().user?.is_seller,
    }),
    {
      name: 'lawareeg-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)

export default useAuthStore
