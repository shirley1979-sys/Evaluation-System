import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface EvidenceLink {
  id: string
  label: string  // 예: "Jira EVX-123", "기획 문서"
  url: string
}

export interface SelfProject {
  id: string
  name: string         // 프로젝트명
  role: string         // 담당 역할
  deliverable: string  // 주요 산출물
  evidenceLinks: EvidenceLink[]  // Jira/Notion/컨퍼런스 등 업무 증빙 링크
}

export interface SelfEvalEntry {
  userId: string
  projects: SelfProject[]
  strengths: string     // 전반적 강점 (잘한 점)
  improvements: string  // 전반적 개선점
  requests: string      // 회사에 요청할 것
  scores: Record<string, number>      // questionId → 1~5점
  textAnswers: Record<string, string> // questionId → 주관식 답변
  status: 'DRAFT' | 'SUBMITTED'
  updatedAt: string | null
  submittedAt: string | null
}

// 작성 진행률 0~100
export function calcSelfProgress(entry: SelfEvalEntry, totalQuestions = 0): number {
  let filled = 0
  const total = 4

  // 1) 프로젝트: 최소 1개, 필수 필드 모두 채움
  const projOk = entry.projects.length > 0 &&
    entry.projects.every((p) => p.name.trim() && p.role.trim())
  if (projOk) filled++

  // 2) 강점
  if (entry.strengths.trim().length >= 10) filled++

  // 3) 개선점
  if (entry.improvements.trim().length >= 10) filled++

  // 4) 척도 (질문이 있을 때만 검사)
  if (totalQuestions === 0 || Object.keys(entry.scores).length >= Math.max(1, Math.floor(totalQuestions * 0.5))) filled++

  return Math.round((filled / total) * 100)
}

interface SelfEvalState {
  entries: SelfEvalEntry[]
  getEntry:    (userId: string) => SelfEvalEntry | undefined
  saveEntry:   (entry: SelfEvalEntry) => void
  submitEntry: (userId: string) => void
  getProgress: (userId: string, totalQuestions?: number) => number
}

export const useSelfEvalStore = create<SelfEvalState>()(
  persist(
    (set, get) => ({
      entries: [],

      getEntry: (userId) => get().entries.find((e) => e.userId === userId),

      saveEntry: (entry) =>
        set((state) => {
          const exists = state.entries.some((e) => e.userId === entry.userId)
          return {
            entries: exists
              ? state.entries.map((e) => e.userId === entry.userId ? { ...entry, updatedAt: new Date().toISOString() } : e)
              : [...state.entries, { ...entry, updatedAt: new Date().toISOString() }],
          }
        }),

      submitEntry: (userId) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.userId === userId
              ? { ...e, status: 'SUBMITTED', submittedAt: new Date().toISOString() }
              : e
          ),
        })),

      getProgress: (userId, totalQuestions = 0) => {
        const entry = get().entries.find((e) => e.userId === userId)
        if (!entry) return 0
        return calcSelfProgress(entry, totalQuestions)
      },
    }),
    { name: 'everex-self-eval' }
  )
)
