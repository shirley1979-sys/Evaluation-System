import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))

// ── 평가 임시저장 ─────────────────────────────
interface SurveyDraftState {
  drafts: Record<string, { scores: Record<string, number>; comment: string }>
  setDraft: (key: string, scores: Record<string, number>, comment: string) => void
  getDraft: (key: string) => { scores: Record<string, number>; comment: string } | undefined
  clearDraft: (key: string) => void
}

export const useSurveyDraftStore = create<SurveyDraftState>((set, get) => ({
  drafts: {},
  setDraft: (key, scores, comment) =>
    set((state) => ({ drafts: { ...state.drafts, [key]: { scores, comment } } })),
  getDraft: (key) => get().drafts[key],
  clearDraft: (key) =>
    set((state) => { const next = { ...state.drafts }; delete next[key]; return { drafts: next } }),
}))
