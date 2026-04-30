import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  provider: string
  credits: number
}

interface AuthState {
  user: User | null
  token: string | null
  setToken: (token: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setToken: async (token: string) => {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        set({ token })
        try {
          const res = await axios.get('/api/auth/me')
          set({ user: res.data })
        } catch {
          set({ token: null, user: null })
        }
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization']
        set({ user: null, token: null })
      },

      refreshUser: async () => {
        const { token } = get()
        if (!token) return
        try {
          const res = await axios.get('/api/auth/me')
          set({ user: res.data })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'mochi-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },
    }
  )
)
