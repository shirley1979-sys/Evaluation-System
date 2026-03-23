'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'
import { DEMO_ACCOUNTS, MOCK_USERS } from '@/lib/mock'

interface AuthState {
  user: AuthUser | null
  login: (email: string, ssnPrefix: string) => boolean
  demoLogin: (role: 'member' | 'manager' | 'hr' | 'admin') => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      login: (email, ssnPrefix) => {
        const account = DEMO_ACCOUNTS.find(
          (a) => a.email === email && a.ssnPrefix === ssnPrefix
        )
        if (!account) return false

        const mockUser = MOCK_USERS.find((u) => u.id === account.userId)
        if (!mockUser) return false

        set({
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            teamId: mockUser.teamId,
          },
        })
        return true
      },

      demoLogin: (role) => {
        const map = {
          member:  'u1',
          manager: 'u2',
          hr:      'u15',
          admin:   'u16',
        }
        const mockUser = MOCK_USERS.find((u) => u.id === map[role])!
        set({
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            teamId: mockUser.teamId,
          },
        })
      },

      logout: () => set({ user: null }),
    }),
    {
      name: 'everex-auth',
    }
  )
)
