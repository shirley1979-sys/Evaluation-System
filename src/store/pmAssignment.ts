import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PmAssignment {
  id: string
  developerId: string
  projectName: string
  pmId: string
  assignedBy: string   // 지정한 개발부문장/관리자 id
  assignedAt: string
}

interface PmAssignmentState {
  assignments: PmAssignment[]
  assign: (developerId: string, projectName: string, pmId: string, assignedBy: string) => void
  remove: (id: string) => void
  getForDeveloper: (developerId: string) => PmAssignment[]
  getAssignedTo: (pmId: string) => PmAssignment[]
}

export const usePmAssignmentStore = create<PmAssignmentState>()(
  persist(
    (set, get) => ({
      assignments: [],

      assign: (developerId, projectName, pmId, assignedBy) =>
        set((state) => ({
          assignments: [
            ...state.assignments,
            { id: crypto.randomUUID(), developerId, projectName, pmId, assignedBy, assignedAt: new Date().toISOString() },
          ],
        })),

      remove: (id) =>
        set((state) => ({ assignments: state.assignments.filter((a) => a.id !== id) })),

      getForDeveloper: (developerId) => get().assignments.filter((a) => a.developerId === developerId),
      getAssignedTo: (pmId) => get().assignments.filter((a) => a.pmId === pmId),
    }),
    { name: 'everex-pm-assignments' }
  )
)
