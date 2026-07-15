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
  division?: string   // 부문 (예: 개발부문)
  jobTitle?: string   // 직책
  jobDuty?: string    // 직무
  email: string
  nameEng?: string
  role: string
  managerEmail?: string
}

// 조직 정보만 업데이트할 때 쓰는 행 (이메일로 기존 인원 매칭, 나머지 필드는 선택)
export interface OrgUpdateRow {
  email: string
  team?: string
  division?: string
  jobTitle?: string
  jobDuty?: string
  role?: string
  managerEmail?: string
}

export function rowsToUsers(rows: UploadRow[]): { users: User[]; teams: Team[] } {
  const teamNames = [...new Set(rows.map((r) => r.team).filter(Boolean))]
  const teams: Team[] = teamNames.map((name, idx) => ({
    id: `team_${idx + 1}`,
    name,
    managerId: null,
    division: rows.find((r) => r.team === name)?.division ?? null,
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
  applyOrgUpdate: (rows: OrgUpdateRow[]) => { matched: number; unmatched: string[] }
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

      // 2차 업로드: 이메일로 기존 직원을 매칭해 팀/부문/직책/직무/역할만 갱신 (이름·닉네임·입사일 등은 유지)
      applyOrgUpdate: (rows) => {
        const byEmail = new Map(rows.map((r) => [r.email.trim().toLowerCase(), r]))
        const unmatched: string[] = []
        let matched = 0

        set((state) => {
          const teams = [...state.teams]
          const findOrCreateTeam = (name: string, division?: string) => {
            let team = teams.find((t) => t.name === name)
            if (!team) {
              team = { id: `team_${teams.length + 1}`, name, managerId: null, division: division ?? null }
              teams.push(team)
            } else if (division && !team.division) {
              team.division = division
            }
            return team
          }

          const employees = state.employees.map((emp) => {
            const update = byEmail.get(emp.email.trim().toLowerCase())
            if (!update) return emp
            matched++
            const team = update.team ? findOrCreateTeam(update.team, update.division) : emp.team
            return {
              ...emp,
              team,
              teamId: team?.id ?? emp.teamId,
              jobTitle: update.jobTitle ?? emp.jobTitle,
              jobDuty: update.jobDuty ?? emp.jobDuty,
              role: (ROLE_MAP[update.role ?? ''] ?? emp.role) as Role,
              managerEmail: update.managerEmail ?? emp.managerEmail,
            }
          })

          for (const r of rows) {
            if (!state.employees.some((e) => e.email.trim().toLowerCase() === r.email.trim().toLowerCase())) {
              unmatched.push(r.email)
            }
          }

          return { employees, teams }
        })

        return { matched, unmatched }
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
