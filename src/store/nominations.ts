import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NominationGroup } from '@/types'
import { MOCK_NOMINATIONS } from '@/lib/mock'

export type NomineeApproval = 'PENDING' | 'APPROVED' | 'DECLINED'

export interface NomineeItem {
  userId: string
  group: NominationGroup
  approval: NomineeApproval
}

export interface NomEntry {
  nominatorId: string
  nominees: NomineeItem[]
  status: 'NONE' | 'SUBMITTED' | 'HR_CONFIRMED'
  hrModified: boolean
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
      status: allConfirmed ? 'HR_CONFIRMED' : 'SUBMITTED',
      hrModified: false,
      confirmedAt: allConfirmed ? new Date().toISOString() : null,
    }
  })
}

interface NominationState {
  entries: NomEntry[]
  submitEntry: (nominatorId: string, nominees: { userId: string; group: NominationGroup }[]) => void
  hrModifyEntry: (nominatorId: string, nominees: { userId: string; group: NominationGroup }[]) => void
  hrConfirmEntry: (nominatorId: string) => void
  hrConfirmAll: () => void
  getEntry: (nominatorId: string) => NomEntry | undefined
  respondToNomination: (nominatorId: string, nomineeUserId: string, approval: 'APPROVED' | 'DECLINED') => void
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
                  ? { ...e, nominees: withApproval, status: 'SUBMITTED', hrModified: false, confirmedAt: null }
                  : e
              ),
            }
          }
          return {
            entries: [
              ...state.entries,
              { nominatorId, nominees: withApproval, status: 'SUBMITTED', hrModified: false, confirmedAt: null },
            ],
          }
        }),

      hrModifyEntry: (nominatorId, nominees) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.nominatorId === nominatorId
              ? { ...e, nominees: nominees.map((n) => ({ ...n, approval: 'PENDING' as const })), hrModified: true, status: 'SUBMITTED', confirmedAt: null }
              : e
          ),
        })),

      hrConfirmEntry: (nominatorId) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.nominatorId === nominatorId
              ? { ...e, status: 'HR_CONFIRMED', confirmedAt: new Date().toISOString() }
              : e
          ),
        })),

      hrConfirmAll: () =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.status === 'SUBMITTED'
              ? { ...e, status: 'HR_CONFIRMED', confirmedAt: new Date().toISOString() }
              : e
          ),
        })),

      getEntry: (nominatorId) => get().entries.find((e) => e.nominatorId === nominatorId),

      // 지정된 당사자(동료)가 본인에 대한 지정을 승인/거절
      respondToNomination: (nominatorId, nomineeUserId, approval) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.nominatorId === nominatorId
              ? {
                  ...e,
                  nominees: e.nominees.map((n) =>
                    n.userId === nomineeUserId ? { ...n, approval } : n
                  ),
                }
              : e
          ),
        })),

      // 특정 사용자가 응답해야 할(PENDING 상태인) 지정 요청 목록
      getPendingApprovalsFor: (userId) => {
        const result: (PendingApproval & { nominatorId: string })[] = []
        for (const entry of get().entries) {
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
