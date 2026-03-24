import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Team, Role } from '@/types'
import { MOCK_USERS, MOCK_TEAMS } from '@/lib/mock'

// ── 엑셀 행 → User 변환 ────────────────────────
const ROLE_MAP: Record<string, Role> = {
  '직원': 'MEMBER', '팀원': 'MEMBER', 'Member': 'MEMBER',
  '팀장': 'MANAGER', 'Manager': 'MANAGER',
  'HR': 'HR_ADMIN', 'HR관리자': 'HR_ADMIN', 'HR_ADMIN': 'HR_ADMIN',
  '슈퍼관리자': 'SUPER_ADMIN', 'Admin': 'SUPER_ADMIN', 'SUPER_ADMIN': 'SUPER_ADMIN',
}

export interface UploadRow {
  name: string
  nameEng?: string
  email: string
  ssnPrefix: string
  team: string
  jobTitle?: string
  role: string
  managerEmail?: string
}

export function rowsToUsers(rows: UploadRow[]): { users: User[]; teams: Team[] } {
  // 팀명 목록 추출
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
      email: row.email,
      role: ROLE_MAP[row.role] ?? 'MEMBER',
      teamId: team?.id ?? null,
      team,
      jobTitle: row.jobTitle ?? null,
      managerEmail: row.managerEmail ?? null,
      isActive: true,
    }
  })

  // 팀장 id를 팀에 반영
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
    }),
    { name: 'everex-employees' }
  )
)
