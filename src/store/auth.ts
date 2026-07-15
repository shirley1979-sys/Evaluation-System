'use client'

import { create } from 'zustand'
import type { AuthUser, Role } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

async function loadProfileAsUser(userId: string): Promise<AuthUser | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, team_id')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as Role,
    teamId: data.team_id,
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,

  login: async (email, password) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }
    const user = await loadProfileAsUser(data.user.id)
    if (!user) {
      await supabase.auth.signOut()
      return { ok: false, error: '직원 정보를 찾을 수 없습니다. HR에 문의하세요.' }
    }
    set({ user, loading: false })
    return { ok: true }
  },

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, loading: false })
  },

  restoreSession: async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      set({ user: null, loading: false })
      return
    }
    const user = await loadProfileAsUser(data.session.user.id)
    set({ user, loading: false })
  },
}))
