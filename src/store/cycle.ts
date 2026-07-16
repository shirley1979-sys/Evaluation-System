import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CyclePhase } from '@/types'
import { MOCK_CYCLE } from '@/lib/mock'

export const PHASE_ORDER: CyclePhase[] = [
  'SETUP', 'NOMINATION', 'HR_CONFIRM', 'EVALUATION', 'CLOSED', 'RESULTS_OPEN',
]

export const PHASE_LABEL: Record<CyclePhase, string> = {
  SETUP:        '사이클 설정',
  NOMINATION:   '동료 추천',
  HR_CONFIRM:   '부문장 검토',
  EVALUATION:   '평가 진행',
  CLOSED:       '평가 마감',
  RESULTS_OPEN: '결과 공개',
}

export const PHASE_NEXT_ACTION: Partial<Record<CyclePhase, string>> = {
  SETUP:      '동료 추천 시작',
  NOMINATION: '부문장 검토 단계로 이동',
  HR_CONFIRM: '평가 시작',
  EVALUATION: '평가 마감',
  CLOSED:     '결과 공개',
}

interface CycleState {
  phase: CyclePhase
  year: number
  evalCloseAt: string | null
  selfEvalOpenAt: string | null
  selfEvalCloseAt: string | null
  advancePhase: () => void
  prevPhase: () => void
  setPhase: (phase: CyclePhase) => void
  setSelfEvalPeriod: (openAt: string | null, closeAt: string | null) => void
}

export const useEvalCycleStore = create<CycleState>()(
  persist(
    (set, get) => ({
      phase: MOCK_CYCLE.phase,
      year: MOCK_CYCLE.year,
      evalCloseAt: MOCK_CYCLE.evalCloseAt,
      selfEvalOpenAt: null,
      selfEvalCloseAt: null,

      advancePhase: () => {
        const idx = PHASE_ORDER.indexOf(get().phase)
        if (idx < PHASE_ORDER.length - 1) set({ phase: PHASE_ORDER[idx + 1] })
      },

      prevPhase: () => {
        const idx = PHASE_ORDER.indexOf(get().phase)
        if (idx > 0) set({ phase: PHASE_ORDER[idx - 1] })
      },

      setPhase: (phase) => set({ phase }),

      setSelfEvalPeriod: (openAt, closeAt) => set({ selfEvalOpenAt: openAt, selfEvalCloseAt: closeAt }),
    }),
    { name: 'everex-cycle' }
  )
)

// 셀프평가 마감 여부 (종료일 자정까지 포함)
export function isSelfEvalClosed(closeAt: string | null): boolean {
  if (!closeAt) return false
  const closeDate = new Date(closeAt)
  closeDate.setHours(23, 59, 59, 999)
  return Date.now() > closeDate.getTime()
}
