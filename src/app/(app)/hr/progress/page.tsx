'use client'

import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { MOCK_SURVEYS, MOCK_NOMINATIONS } from '@/lib/mock'
import { useEmployeeStore } from '@/store/employees'
import { useEvalCycleStore, PHASE_LABEL } from '@/store/cycle'

export default function HRProgressPage() {
  const user = useAuthStore((s) => s.user)
  const allEmployees = useEmployeeStore((s) => s.employees)
  const { phase, year } = useEvalCycleStore()
  if (!user) return null

  const employees = allEmployees.filter((u) => u.isActive && u.role !== 'SUPER_ADMIN' && u.role !== 'HR_ADMIN')
  const total = employees.length

  const countByType = (type: string) =>
    new Set(MOCK_SURVEYS.filter((s) => s.type === type && s.status === 'SUBMITTED').map((s) => s.surveyorId)).size

  const nominationConfirmed = new Set(MOCK_NOMINATIONS.filter((n) => n.status === 'CONFIRMED').map((n) => n.nominatorId)).size

  const stats = [
    { label: '셀프 평가',  done: countByType('SELF'),    color: 'bg-mint-500' },
    { label: '동료 평가',  done: countByType('PEER'),    color: 'bg-purple-500' },
    { label: '상향 평가',  done: countByType('UPWARD'),  color: 'bg-amber-500' },
    { label: '하향 평가',  done: countByType('DOWNWARD'), color: 'bg-blue-500' },
  ]

  // 팀별 진행률
  const teamMap = new Map<string, { name: string; total: number; completed: number }>()
  for (const emp of employees) {
    const key = emp.team?.name ?? '미배정'
    if (!teamMap.has(key)) teamMap.set(key, { name: key, total: 0, completed: 0 })
    const t = teamMap.get(key)!
    t.total++
    if (MOCK_SURVEYS.filter((s) => s.surveyorId === emp.id && s.status === 'SUBMITTED').length >= 2) t.completed++
  }
  const teamList = Array.from(teamMap.values()).sort((a, b) => b.total - a.total)

  return (
    <>
      <Topbar title="전체 진행률" subtitle={`${year}년 다면평가 · ${PHASE_LABEL[phase]}`} cycleOpen={phase === 'EVALUATION'} />
      <div className="flex-1 overflow-y-auto p-7 space-y-5 max-w-4xl">

        {/* 동료 추천 확정 배너 */}
        <div className="bg-mint-50 border border-mint-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-mint-500 flex items-center justify-center flex-shrink-0">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#0D1B2A]">동료 추천 확정</p>
            <p className="text-xs text-[#4A5568] mt-0.5">{nominationConfirmed}/{total}명 확정 완료</p>
          </div>
          <div className="text-2xl font-extrabold text-mint-600">
            {total > 0 ? Math.round(nominationConfirmed / total * 100) : 0}%
          </div>
        </div>

        {/* 유형별 통계 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const rate = total > 0 ? Math.round((s.done / total) * 100) : 0
            return (
              <div key={s.label} className="bg-white rounded-2xl shadow-card p-5">
                <p className="text-xs text-[#8896A8] mb-2">{s.label}</p>
                <p className="text-2xl font-extrabold text-[#0D1B2A]">{rate}%</p>
                <p className="text-xs text-[#8896A8] mt-0.5">{s.done}/{total}명</p>
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${s.color}`} style={{ width: `${rate}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* 팀별 진행률 */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-[#0D1B2A] mb-4">팀별 진행률</h3>
          <div className="space-y-3">
            {teamList.map((team) => {
              const rate = team.total > 0 ? Math.round((team.completed / team.total) * 100) : 0
              return (
                <div key={team.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-[#0D1B2A]">{team.name}</span>
                    <span className="text-xs text-[#8896A8]">{team.completed}/{team.total}명 · {rate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${rate === 100 ? 'bg-green-500' : rate >= 70 ? 'bg-mint-500' : rate >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 미완료 직원 */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-[#0D1B2A] mb-3">미완료 직원</h3>
          <div className="space-y-1.5">
            {employees
              .filter((emp) => MOCK_SURVEYS.filter((s) => s.surveyorId === emp.id && s.status === 'SUBMITTED').length < 2)
              .map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F4FA] transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {emp.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0D1B2A]">{emp.name}</p>
                    <p className="text-xs text-[#8896A8]">{emp.team?.name ?? '미배정'}</p>
                  </div>
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">미완료</span>
                </div>
              ))}
            {employees.filter((emp) => MOCK_SURVEYS.filter((s) => s.surveyorId === emp.id && s.status === 'SUBMITTED').length < 2).length === 0 && (
              <p className="text-sm text-[#8896A8] py-2">모든 직원이 완료했습니다 🎉</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
