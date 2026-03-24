'use client'

import { useState, useMemo } from 'react'
import { useAuthStore } from '@/store/auth'
import { useEmployeeStore } from '@/store/employees'
import Topbar from '@/components/layout/Topbar'
import { MOCK_NOMINATIONS } from '@/lib/mock'
import type { User } from '@/types'

const MAX_TEAMMATES = 4
const MAX_COLLABS = 4
const MAX_TOTAL = 7
const MIN_TOTAL = 3

export default function NominationPage() {
  const user = useAuthStore((s) => s.user)
  const allEmployees = useEmployeeStore((s) => s.employees)

  const initialSelected = MOCK_NOMINATIONS
    .filter((n) => n.nominatorId === user?.id)
    .map((n) => ({ id: n.nomineeId, group: n.groupType as 'TEAMMATE' | 'COLLAB' }))

  const [selected, setSelected] = useState(initialSelected)
  const [submitted, setSubmitted] = useState(initialSelected.length > 0)
  const [search, setSearch] = useState('')

  if (!user) return null

  const teammates = selected.filter((s) => s.group === 'TEAMMATE')
  const collabs = selected.filter((s) => s.group === 'COLLAB')
  const total = selected.length

  const myTeamId = user.teamId
  const allOthers = allEmployees.filter((u) => u.id !== user.id && u.isActive)
  const filtered = useMemo(() =>
    allOthers.filter((e) => e.name.includes(search) || e.email.includes(search)),
    [search]
  )
  const myTeammates = filtered.filter((e) => e.teamId === myTeamId)
  const otherTeam = filtered.filter((e) => e.teamId !== myTeamId)

  function toggle(userId: string, group: 'TEAMMATE' | 'COLLAB') {
    if (submitted) return
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === userId)
      if (exists) return prev.filter((s) => s.id !== userId)
      if (group === 'TEAMMATE' && teammates.length >= MAX_TEAMMATES) return prev
      if (group === 'COLLAB' && collabs.length >= MAX_COLLABS) return prev
      if (total >= MAX_TOTAL) return prev
      return [...prev, { id: userId, group }]
    })
  }

  return (
    <>
      <Topbar title="동료 추천" subtitle={`${total}/${MAX_TOTAL}명 선택`} />
      <div className="flex-1 overflow-y-auto p-7 space-y-5 max-w-2xl">
        {submitted ? (
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div>
              추천이 완료되었습니다. HR 확정 대기 중입니다.
              <button onClick={() => setSubmitted(false)} className="ml-3 text-xs text-green-600 underline">수정하기</button>
            </div>
          </div>
        ) : null}

        {/* 선택 현황 */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#0D1B2A] text-sm">선택한 동료 <span className="text-blue-600">{total}</span>/{MAX_TOTAL}</h3>
            <span className="text-xs text-[#8896A8]">팀원 최대 {MAX_TEAMMATES}명 · 협업 최대 {MAX_COLLABS}명</span>
          </div>

          <div className="flex flex-wrap gap-2 min-h-10 mb-4">
            {selected.map(({ id, group }) => {
              const emp = allEmployees.find((e) => e.id === id)
              if (!emp) return null
              return (
                <span key={id} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  group === 'TEAMMATE' ? 'bg-mint-50 border-mint-200 text-mint-700' : 'bg-purple-50 border-purple-200 text-purple-700'
                }`}>
                  {emp.name}
                  {!submitted && (
                    <button onClick={() => toggle(id, group)} className="hover:opacity-70 font-bold leading-none">×</button>
                  )}
                </span>
              )
            })}
            {selected.length === 0 && <span className="text-sm text-[#8896A8]">아래 목록에서 동료를 선택하세요</span>}
          </div>

          {!submitted && (
            <button
              onClick={() => setSubmitted(true)}
              disabled={total < MIN_TOTAL}
              className="w-full h-11 bg-mint-500 text-white font-semibold text-sm rounded-xl disabled:opacity-40 hover:bg-mint-600 transition-colors"
            >
              추천 제출 ({total}/{MAX_TOTAL}명) {total < MIN_TOTAL && `— 최소 ${MIN_TOTAL}명 필요`}
            </button>
          )}
        </div>

        {/* 검색 */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8896A8]" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름으로 검색"
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#DDE3EE] rounded-xl text-sm focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100" />
        </div>

        <EmployeeSection title="같은 팀 동료" group="TEAMMATE" employees={myTeammates} selected={selected} onToggle={toggle} disabled={submitted} max={MAX_TEAMMATES} current={teammates.length} />
        <EmployeeSection title="협업 부서" group="COLLAB" employees={otherTeam} selected={selected} onToggle={toggle} disabled={submitted} max={MAX_COLLABS} current={collabs.length} />
      </div>
    </>
  )
}

function EmployeeSection({ title, group, employees, selected, onToggle, disabled, max, current }: {
  title: string; group: 'TEAMMATE' | 'COLLAB'; employees: User[]
  selected: { id: string; group: string }[]; onToggle: (id: string, group: 'TEAMMATE' | 'COLLAB') => void
  disabled: boolean; max: number; current: number
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[#0D1B2A] text-sm">{title}</h3>
        <span className="text-xs text-[#8896A8]">{current}/{max}명</span>
      </div>
      <div className="space-y-1.5">
        {employees.map((emp) => {
          const isSelected = selected.some((s) => s.id === emp.id)
          return (
            <button key={emp.id} onClick={() => onToggle(emp.id, group)}
              disabled={disabled || (!isSelected && current >= max)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                isSelected ? 'bg-mint-50 border border-mint-200' : 'hover:bg-[#F0F4FA] border border-transparent disabled:opacity-40 disabled:cursor-not-allowed'
              }`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {emp.name.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#0D1B2A]">{emp.name}</p>
                <p className="text-xs text-[#8896A8]">{emp.jobTitle} · {emp.team?.name}</p>
              </div>
              {isSelected && (
                <svg className="text-mint-500 flex-shrink-0" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          )
        })}
        {employees.length === 0 && <p className="text-sm text-center text-[#8896A8] py-4">해당하는 직원이 없습니다</p>}
      </div>
    </div>
  )
}
