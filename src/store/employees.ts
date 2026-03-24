import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Team, Role } from '@/types'
import { MOCK_USERS, MOCK_TEAMS } from '@/lib/mock'

// ── 엑셀 행 → User 변환 ────────────────────────
const ROLE_MAP: Record<string, Role> = {
  '직원': 'MEMBER', '팀원': 'MEMBER', 'Member': 'MEMBER', 'MEMBER': 'MEMBER',
  '팀장': 'MANAGER', 'Manager': 'MANAGER', 'MANAGER': 'MANAGER',
  '임원': 'EXECUTIVE', 'Executive': 'EXECUTIVE', 'EXECUTIVE': 'EXECUTIVE',
  'HR': 'HR_ADMIN', 'HR관리자': 'HR_ADMIN', 'HR_ADMIN': 'HR_ADMIN',
  '슈퍼관리자': 'SUPER_ADMIN', 'Admin': 'SUPER_ADMIN', 'SUPER_ADMIN': 'SUPER_ADMIN',
}

export interface UploadRow {
  name: string
  ssnPrefix: string
  nickname?: string
  hireDate?: string
  leaveDate?: string
  team: string
  jobTitle?: string   // 직책
  jobDuty?: string    // 직무
  email: string
  nameEng?: string
  role: string
  managerEmail?: string
}

export function rowsToUsers(rows: UploadRow[]): { users: User[]; teams: Team[] } {
  const teamNames = [...new Set(rows.map((r) => r.team).filter(Boolean))]
  const teams: Team[] = teamNames.map((name, idx) => ({
    id: `team_${idx + 1}`,
    name,
    managerId: null,
  }))

  const users: User[] = rows.map((row, idx) => {
    const team = teams.find((t) => t.name === row.team)
    return {
      id: `u_${idx + 1}`,
      name: row.name,
      nameEng: row.nameEng ?? null,
      nickname: row.nickname ?? null,
      email: row.email,
      role: ROLE_MAP[row.role] ?? 'MEMBER',
      teamId: team?.id ?? null,
      team,
      jobTitle: row.jobTitle ?? null,
      jobDuty: row.jobDuty ?? null,
      hireDate: row.hireDate ?? null,
      leaveDate: row.leaveDate ?? null,
      ssnPrefix: row.ssnPrefix ?? null,
      managerEmail: row.managerEmail ?? null,
      isActive: true,
    }
  })

  teams.forEach((team) => {
    const manager = users.find((u) => u.teamId === team.id && u.role === 'MANAGER')
    if (manager) team.managerId = manager.id
  })

  return { users, teams }
}

// ── Zustand Store ─────────────────────────────
interface EmployeeState {
  employees: User[]
  teams: Team[]
  hasUploaded: boolean

  setFromUpload: (rows: UploadRow[]) => void
  resetToMock: () => void
  removeEmployee: (id: string) => void
  updateRole: (id: string, role: Role) => void
}

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set) => ({
      employees: MOCK_USERS,
      teams: MOCK_TEAMS,
      hasUploaded: false,

      setFromUpload: (rows) => {
        const { users, teams } = rowsToUsers(rows)
        set({ employees: users, teams, hasUploaded: true })
      },

      resetToMock: () =>
        set({ employees: MOCK_USERS, teams: MOCK_TEAMS, hasUploaded: false }),

      removeEmployee: (id) =>
        set((state) => ({ employees: state.employees.filter((e) => e.id !== id) })),

      updateRole: (id, role) =>
        set((state) => ({
          employees: state.employees.map((e) => e.id === id ? { ...e, role } : e),
        })),
    }),
    { name: 'everex-employees' }
  )
)
