import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MemberReview {
  targetId: string
  performanceScore: number | null   // 업무성과 척도 1~5
  competencyScore:  number | null   // 역량발휘 척도 1~5
  collaborationScore: number | null // 협업 태도 척도 1~5
  performance:   string  // 업무성과 서술
  competency:    string  // 역량발휘 서술
  collaboration: string  // 협업 태도 서술
  overall:       string  // 종합 의견
  savedAt:    string | null
  submitted:  boolean
}

export const REVIEW_CATEGORIES = [
  { key: 'performance',   label: '업무성과',  scoreKey: 'performanceScore'   },
  { key: 'competency',    label: '역량발휘',  scoreKey: 'competencyScore'    },
  { key: 'collaboration', label: '협업 태도', scoreKey: 'collaborationScore' },
] as const

export function emptyReview(targetId: string): MemberReview {
  return {
    targetId, performanceScore: null, competencyScore: null, collaborationScore: null,
    performance: '', competency: '', collaboration: '', overall: '',
    savedAt: null, submitted: false,
  }
}

interface ManagerReviewState {
  // managerId → MemberReview[]
  reviewMap: Record<string, MemberReview[]>
  getReview:    (managerId: string, targetId: string) => MemberReview | undefined
  saveReview:   (managerId: string, review: MemberReview) => void
  submitReview: (managerId: string, targetId: string) => void
  getSubmittedCount: (managerId: string) => number
}

export const useManagerReviewStore = create<ManagerReviewState>()(
  persist(
    (set, get) => ({
      reviewMap: {},

      getReview: (managerId, targetId) =>
        get().reviewMap[managerId]?.find((r) => r.targetId === targetId),

      saveReview: (managerId, review) =>
        set((state) => {
          const list = state.reviewMap[managerId] ?? []
          const exists = list.some((r) => r.targetId === review.targetId)
          return {
            reviewMap: {
              ...state.reviewMap,
              [managerId]: exists
                ? list.map((r) => r.targetId === review.targetId
                    ? { ...review, savedAt: new Date().toISOString() }
                    : r)
                : [...list, { ...review, savedAt: new Date().toISOString() }],
            },
          }
        }),

      submitReview: (managerId, targetId) =>
        set((state) => {
          const list = state.reviewMap[managerId] ?? []
          return {
            reviewMap: {
              ...state.reviewMap,
              [managerId]: list.map((r) =>
                r.targetId === targetId ? { ...r, submitted: true } : r
              ),
            },
          }
        }),

      getSubmittedCount: (managerId) =>
        (get().reviewMap[managerId] ?? []).filter((r) => r.submitted).length,
    }),
    { name: 'everex-manager-reviews' }
  )
)
