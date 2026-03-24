import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NominationGroup } from '@/types'
import { MOCK_NOMINATIONS } from '@/lib/mock'

export interface NomEntry {
  nominatorId: string
  nominees: { userId: string; group: NominationGroup }[]
  status: 'NONE' | 'SUBMITTED' | 'HR_CONFIRMED'
  hrModified: boolean
  confirmedAt: string | null
}

// 초기 상태: MOCK_NOMINATIONS에서 변환
function buildInitialEntries(): NomEntry[] {
  const nominatorIds = [...new Set(MOCK_NOMINATIONS.map((n) => n.nominatorId))]
  return nominatorIds.map((nId) => {
    const noms = MOCK_NOMINATIONS.filter((n) => n.nominatorId === nId)
    const allConfirmed = noms.every((n) => n.status === 'CONFIRMED')
    return {
      nominatorId: nId,
      nominees: noms.map((n) => ({ userId: n.nomineeId, group: n.groupType })),
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
  resetToMock: () => void
}

export const useNominationStore = create<NominationState>()(
  persist(
    (set, get) => ({
      entries: buildInitialEntries(),

      submitEntry: (nominatorId, nominees) =>
        set((state) => {
          const existing = state.entries.find((e) => e.nominatorId === nominatorId)
          if (existing) {
            return {
              entries: state.entries.map((e) =>
                e.nominatorId === nominatorId
                  ? { ...e, nominees, status: 'SUBMITTED', hrModified: false, confirmedAt: null }
                  : e
              ),
            }
          }
          return {
            entries: [
              ...state.entries,
              { nominatorId, nominees, status: 'SUBMITTED', hrModified: false, confirmedAt: null },
            ],
          }
        }),

      hrModifyEntry: (nominatorId, nominees) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.nominatorId === nominatorId
              ? { ...e, nominees, hrModified: true, status: 'SUBMITTED', confirmedAt: null }
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

      resetToMock: () => set({ entries: buildInitialEntries() }),
    }),
    { name: 'everex-nominations' }
  )
)
