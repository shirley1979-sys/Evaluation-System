import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NominationGroup } from '@/types'
import { MOCK_NOMINATIONS } from '@/lib/mock'

export type NomineeApproval = 'PENDING' | 'APPROVED' | 'DECLINED'

export interface NomineeItem {
  userId: string
  group: NominationGroup
  approval: NomineeApproval
  declineReason?: string
}

// 프로세스: 제출(SUBMITTED) → 부문장/관리자 검토·확정(CONFIRMED) → 동료 승인/거절(각 nominee.approval)
export interface NomEntry {
  nominatorId: string
  nominees: NomineeItem[]
  status: 'NONE' | 'SUBMITTED' | 'CONFIRMED'
  reviewedBy: string | null   // 검토(확정)한 부문장/관리자 id
  reviewerModified: boolean
  confirmedAt: string | null
}

export interface PendingApproval {
  nominatorId: string
  group: NominationGroup
}

// 초기 상태: MOCK_NOMINATIONS에서 변환 (기존 확정 데이터는 이미 승인된 것으로 간주)
function buildInitialEntries(): NomEntry[] {
  const nominatorIds = [...new Set(MOCK_NOMINATIONS.map((n) => n.nominatorId))]
  return nominatorIds.map((nId) => {
    const noms = MOCK_NOMINATIONS.filter((n) => n.nominatorId === nId)
    const allConfirmed = noms.every((n) => n.status === 'CONFIRMED')
    return {
      nominatorId: nId,
      nominees: noms.map((n) => ({ userId: n.nomineeId, group: n.groupType, approval: 'APPROVED' as const })),
      status: allConfirmed ? 'CONFIRMED' : 'SUBMITTED',
      reviewedBy: allConfirmed ? 'hr' : null,
      reviewerModified: false,
      confirmedAt: allConfirmed ? new Date().toISOString() : null,
    }
  })
}

interface NominationState {
  entries: NomEntry[]
  submitEntry: (nominatorId: string, nominees: { userId: string; group: NominationGroup }[]) => void
  reviewerModifyEntry: (nominatorId: string, nominees: { userId: string; group: NominationGroup }[]) => void
  confirmEntry: (nominatorId: string, reviewerId: string) => void
  confirmAll: (reviewerId: string) => void
  getEntry: (nominatorId: string) => NomEntry | undefined
  respondToNomination: (nominatorId: string, nomineeUserId: string, approval: 'APPROVED' | 'DECLINED', declineReason?: string) => void
  getPendingApprovalsFor: (userId: string) => (PendingApproval & { nominatorId: string })[]
  resetToMock: () => void
}

export const useNominationStore = create<NominationState>()(
  persist(
    (set, get) => ({
      entries: buildInitialEntries(),

      submitEntry: (nominatorId, nominees) =>
        set((state) => {
          const withApproval: NomineeItem[] = nominees.map((n) => ({ ...n, approval: 'PENDING' }))
          const existing = state.entries.find((e) => e.nominatorId === nominatorId)
          if (existing) {
            return {
              entries: state.entries.map((e) =>
                e.nominatorId === nominatorId
                  ? { ...e, nominees: withApproval, status: 'SUBMITTED', reviewedBy: null, reviewerModified: false, confirmedAt: null }
                  : e
              ),
            }
          }
          return {
            entries: [
              ...state.entries,
              { nominatorId, nominees: withApproval, status: 'SUBMITTED', reviewedBy: null, reviewerModified: false, confirmedAt: null },
            ],
          }
        }),

      // 부문장/관리자가 명단을 검토하며 수정 (확정 전 단계로 되돌림)
      reviewerModifyEntry: (nominatorId, nominees) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.nominatorId === nominatorId
              ? { ...e, nominees: nominees.map((n) => ({ ...n, approval: 'PENDING' as const })), reviewerModified: true, status: 'SUBMITTED', reviewedBy: null, confirmedAt: null }
              : e
          ),
        })),

      // 부문장 또는 관리자가 명단을 확정 → 이 시점부터 동료 승인/거절 요청이 열림
      confirmEntry: (nominatorId, reviewerId) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.nominatorId === nominatorId
              ? { ...e, status: 'CONFIRMED', reviewedBy: reviewerId, confirmedAt: new Date().toISOString() }
              : e
          ),
        })),

      confirmAll: (reviewerId) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.status === 'SUBMITTED'
              ? { ...e, status: 'CONFIRMED', reviewedBy: reviewerId, confirmedAt: new Date().toISOString() }
              : e
          ),
        })),

      getEntry: (nominatorId) => get().entries.find((e) => e.nominatorId === nominatorId),

      // 지정된 당사자(동료)가 본인에 대한 지정을 승인/거절 (거절 시 사유 기재 가능)
      // 부문장/관리자 확정(CONFIRMED) 이후에만 응답 가능
      respondToNomination: (nominatorId, nomineeUserId, approval, declineReason) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.nominatorId === nominatorId && e.status === 'CONFIRMED'
              ? {
                  ...e,
                  nominees: e.nominees.map((n) =>
                    n.userId === nomineeUserId
                      ? { ...n, approval, declineReason: approval === 'DECLINED' ? declineReason : undefined }
                      : n
                  ),
                }
              : e
          ),
        })),

      // 특정 사용자가 응답해야 할(PENDING 상태이면서 부문장/관리자 확정이 끝난) 지정 요청 목록
      getPendingApprovalsFor: (userId) => {
        const result: (PendingApproval & { nominatorId: string })[] = []
        for (const entry of get().entries) {
          if (entry.status !== 'CONFIRMED') continue
          for (const n of entry.nominees) {
            if (n.userId === userId && n.approval === 'PENDING') {
              result.push({ nominatorId: entry.nominatorId, group: n.group })
            }
          }
        }
        return result
      },

      resetToMock: () => set({ entries: buildInitialEntries() }),
    }),
    { name: 'everex-nominations' }
  )
)
