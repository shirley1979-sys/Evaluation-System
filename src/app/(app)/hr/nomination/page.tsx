'use client'

import { useState, useMemo } from 'react'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { useNominationStore, type NomEntry } from '@/store/nominations'
import { useEmployeeStore } from '@/store/employees'
import { useEvalCycleStore, PHASE_LABEL } from '@/store/cycle'
import type { NominationGroup, User } from '@/types'

const GROUP_LABEL: Record<NominationGroup, string> = { TEAMMATE: '팀원', COLLAB: '협업' }
const GROUP_COLOR: Record<NominationGroup, string> = {
  TEAMMATE: 'bg-blue-50 border-blue-200 text-blue-700',
  COLLAB:   'bg-purple-50 border-purple-200 text-purple-700',
}

const ROLE_LABEL: Record<string, string> = { EXECUTIVE: '부문장', SUPER_ADMIN: '관리자', HR_ADMIN: 'HR 관리자' }

export default function HRNominationPage() {
  const user = useAuthStore((s) => s.user)
  const { entries, confirmEntry, confirmAll, reviewerModifyEntry } = useNominationStore()
  const allEmployees = useEmployeeStore((s) => s.employees)
  const { phase, year } = useEvalCycleStore()

  const [editTarget, setEditTarget] = useState<NomEntry | null>(null)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUBMITTED' | 'CONFIRMED'>('ALL')

  if (!user) return null
  const reviewerLabel = ROLE_LABEL[user.role] ?? '검토자'

  const visibleEntries = filterStatus === 'ALL'
    ? entries
    : entries.filter((e) => e.status === filterStatus)

  const submittedCount  = entries.filter((e) => e.status === 'SUBMITTED').length
  const confirmedCount  = entries.filter((e) => e.status === 'CONFIRMED').length
  const total           = entries.length

  function getEmployee(id: string) {
    return allEmployees.find((e) => e.id === id)
  }

  function handleBulkConfirm() {
    if (submittedCount === 0 || !user) return
    if (window.confirm(`미확정 ${submittedCount}건을 모두 확정하시겠습니까?`)) {
      confirmAll(user.id)
    }
  }

  return (
    <>
      <Topbar
        title="동료 확정"
        subtitle={`${year}년 다면평가 · ${PHASE_LABEL[phase]} · ${reviewerLabel} 검토 · ${confirmedCount}/${total}명 확정`}
      />
      <div className="flex-1 overflow-y-auto p-7 space-y-5 max-w-4xl">

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '전체 제출', value: total,          color: 'text-[#0D1B2A]' },
            { label: '검토 대기', value: submittedCount, color: 'text-amber-600'  },
            { label: '확정 완료', value: confirmedCount, color: 'text-green-600'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-card p-5 text-center">
              <p className="text-xs text-[#8896A8] mb-1">{label}</p>
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* 필터 + 일괄 확정 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {(['ALL', 'SUBMITTED', 'CONFIRMED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === s
                    ? 'bg-mint-500 text-white'
                    : 'bg-white border border-[#DDE3EE] text-[#4A5568] hover:bg-gray-50'
                }`}
              >
                {s === 'ALL' ? '전체' : s === 'SUBMITTED' ? '검토 대기' : '확정 완료'}
                <span className="ml-1 opacity-70">
                  ({s === 'ALL' ? total : s === 'SUBMITTED' ? submittedCount : confirmedCount})
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={handleBulkConfirm}
            disabled={submittedCount === 0}
            className="text-sm font-semibold text-white bg-mint-500 px-4 py-2 rounded-xl hover:bg-mint-600 disabled:opacity-40 transition-colors"
          >
            전체 일괄 확정 ({submittedCount})
          </button>
        </div>

        {/* 목록 */}
        {visibleEntries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center">
            <p className="text-sm text-[#8896A8]">해당 항목이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleEntries.map((entry) => {
              const nominator = getEmployee(entry.nominatorId)
              const isConfirmed = entry.status === 'CONFIRMED'
              return (
                <div key={entry.nominatorId} className="bg-white rounded-2xl shadow-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-mint-500 to-mint-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {nominator?.name.slice(0, 2) ?? '??'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#0D1B2A] text-sm">{nominator?.name}</p>
                          {entry.reviewerModified && (
                            <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full">검토자 수정됨</span>
                          )}
                        </div>
                        <p className="text-xs text-[#8896A8]">{nominator?.team?.name} · {nominator?.jobTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isConfirmed && (
                        <button
                          onClick={() => setEditTarget(entry)}
                          className="text-xs font-medium text-[#4A5568] border border-[#DDE3EE] px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          명단 수정
                        </button>
                      )}
                      {isConfirmed ? (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                          확정 완료
                        </span>
                      ) : (
                        <button
                          onClick={() => user && confirmEntry(entry.nominatorId, user.id)}
                          className="text-xs font-semibold text-white bg-mint-500 px-3 py-1.5 rounded-lg hover:bg-mint-600 transition-colors"
                        >
                          확정
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 피추천인 목록 */}
                  <div className="flex flex-wrap gap-2">
                    {entry.nominees.map(({ userId, group, approval, declineReason }) => {
                      const nominee = getEmployee(userId)
                      const declined = approval === 'DECLINED'
                      const approved = approval === 'APPROVED'
                      return (
                        <span
                          key={userId}
                          title={declined ? `거절 사유: ${declineReason || '(사유 없음)'}` : undefined}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            declined
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : isConfirmed
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : GROUP_COLOR[group]
                          }`}
                        >
                          {nominee?.name ?? userId}
                          <span className="opacity-60">{GROUP_LABEL[group]}</span>
                          {(!isConfirmed || declined || approved) && (
                            <span className="opacity-70">· {declined ? '거절' : approved ? '승인' : '대기'}</span>
                          )}
                        </span>
                      )
                    })}
                    {entry.nominees.length === 0 && (
                      <span className="text-xs text-[#8896A8]">추천 없음</span>
                    )}
                  </div>

                  {/* 거절 인원 재배치 안내 */}
                  {entry.nominees.some((n) => n.approval === 'DECLINED') && (
                    <div className="flex items-center justify-between mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-700">
                        {entry.nominees.filter((n) => n.approval === 'DECLINED').map((n) => getEmployee(n.userId)?.name).join(', ')}님이 거절했습니다. 명단 수정에서 다른 동료로 교체해주세요.
                      </p>
                      <button
                        onClick={() => setEditTarget(entry)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 underline flex-shrink-0 ml-3"
                      >
                        재배치하기
                      </button>
                    </div>
                  )}

                  {/* 확정일 */}
                  {isConfirmed && entry.confirmedAt && (
                    <p className="text-[11px] text-[#8896A8] mt-2">
                      확정일: {new Date(entry.confirmedAt).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editTarget && (
        <EditModal
          entry={editTarget}
          allEmployees={allEmployees}
          onClose={() => setEditTarget(null)}
          onSave={(nominees) => {
            reviewerModifyEntry(editTarget.nominatorId, nominees)
            setEditTarget(null)
          }}
        />
      )}
    </>
  )
}

// ── 명단 수정 모달 ────────────────────────────────
function EditModal({
  entry,
  allEmployees,
  onClose,
  onSave,
}: {
  entry: NomEntry
  allEmployees: User[]
  onClose: () => void
  onSave: (nominees: { userId: string; group: NominationGroup }[]) => void
}) {
  const [nominees, setNominees] = useState(entry.nominees)
  const [search, setSearch] = useState('')
  const [addGroup, setAddGroup] = useState<NominationGroup>('TEAMMATE')

  const MAX = 7
  const nominatorTeamId = allEmployees.find((e) => e.id === entry.nominatorId)?.teamId

  const candidatePool = useMemo(() =>
    allEmployees.filter((e) =>
      e.id !== entry.nominatorId &&
      e.isActive &&
      e.role !== 'EXECUTIVE' &&
      !nominees.some((n) => n.userId === e.id) &&
      (e.name.includes(search) || (e.team?.name ?? '').includes(search) || (e.jobTitle ?? '').includes(search))
    ),
  [allEmployees, nominees, search, entry.nominatorId])

  function addNominee(emp: User) {
    if (nominees.length >= MAX) return
    const group: NominationGroup = emp.teamId === nominatorTeamId ? 'TEAMMATE' : 'COLLAB'
    setNominees((prev) => [...prev, { userId: emp.id, group, approval: 'PENDING' }])
  }

  function removeNominee(userId: string) {
    setNominees((prev) => prev.filter((n) => n.userId !== userId))
  }

  function changeGroup(userId: string, group: NominationGroup) {
    setNominees((prev) => prev.map((n) => n.userId === userId ? { ...n, group } : n))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-[#DDE3EE] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#0D1B2A]">동료 명단 수정</h3>
            <p className="text-xs text-[#8896A8] mt-0.5">
              현재 {nominees.length}/{MAX}명 선택됨
            </p>
          </div>
          <button onClick={onClose} className="text-[#8896A8] hover:text-[#0D1B2A] transition-colors">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 좌: 현재 선택 명단 */}
          <div className="w-1/2 p-4 border-r border-[#DDE3EE] overflow-y-auto">
            <p className="text-xs font-semibold text-[#4A5568] mb-3 uppercase tracking-wide">선택된 동료</p>
            {nominees.length === 0 ? (
              <p className="text-xs text-[#8896A8] py-4 text-center">선택된 동료가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {nominees.map(({ userId, group, approval, declineReason }) => {
                  const emp = allEmployees.find((e) => e.id === userId)
                  const declined = approval === 'DECLINED'
                  return (
                    <div key={userId} className={`flex items-center gap-2 p-2 rounded-xl ${declined ? 'bg-red-50' : 'bg-[#F8FAFD]'}`}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-mint-500 to-mint-700 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {emp?.name.slice(0, 2) ?? '??'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0D1B2A] truncate">{emp?.name}</p>
                        <p className={`text-[10px] truncate ${declined ? 'text-red-600' : 'text-[#8896A8]'}`}>
                          {declined ? `거절함${declineReason ? ` — ${declineReason}` : ''}` : emp?.team?.name}
                        </p>
                      </div>
                      <select
                        value={group}
                        onChange={(e) => changeGroup(userId, e.target.value as NominationGroup)}
                        className="text-[10px] border border-[#DDE3EE] rounded px-1 py-0.5 bg-white focus:outline-none"
                      >
                        <option value="TEAMMATE">팀원</option>
                        <option value="COLLAB">협업</option>
                      </select>
                      <button
                        onClick={() => removeNominee(userId)}
                        className="text-[#8896A8] hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 우: 직원 검색/추가 */}
          <div className="w-1/2 p-4 flex flex-col overflow-hidden">
            <p className="text-xs font-semibold text-[#4A5568] mb-2 uppercase tracking-wide">직원 추가</p>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 팀, 직무 검색..."
              className="w-full h-8 px-3 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-mint-400 mb-3"
            />
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {nominees.length >= MAX ? (
                <p className="text-xs text-amber-600 py-2 text-center">최대 {MAX}명까지 선택 가능합니다</p>
              ) : candidatePool.length === 0 ? (
                <p className="text-xs text-[#8896A8] py-4 text-center">검색 결과 없음</p>
              ) : (
                candidatePool.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => addNominee(emp)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-mint-50 hover:border-mint-200 border border-transparent transition-all text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {emp.name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#0D1B2A] truncate">{emp.name}</p>
                      <p className="text-[10px] text-[#8896A8] truncate">{emp.team?.name} · {emp.jobTitle}</p>
                    </div>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-mint-500 flex-shrink-0">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-[#DDE3EE] flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 border border-[#DDE3EE] text-sm font-medium text-[#4A5568] rounded-xl hover:bg-gray-50">취소</button>
          <button
            onClick={() => onSave(nominees)}
            className="flex-1 h-10 bg-mint-500 text-white font-semibold text-sm rounded-xl hover:bg-mint-600"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
