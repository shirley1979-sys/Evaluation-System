'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { useEmployeeStore } from '@/store/employees'
import { useManagerReviewStore } from '@/store/managerReview'
import { usePmAssignmentStore } from '@/store/pmAssignment'
import MemberReviewPanel from '@/components/review/MemberReviewPanel'
import { MOCK_SCORES, MOCK_SURVEYS } from '@/lib/mock'
import { scoreToGrade } from '@/lib/score'
import type { User } from '@/types'

const GRADE_COLOR: Record<string, string> = {
  S: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  A: 'bg-mint-50 text-mint-700 border-mint-200',
  B: 'bg-green-50 text-green-700 border-green-200',
  C: 'bg-orange-50 text-orange-700 border-orange-200',
  D: 'bg-red-50 text-red-700 border-red-200',
  '-': 'bg-gray-50 text-gray-500 border-gray-200',
}

export default function TeamReportPage() {
  const user      = useAuthStore((s) => s.user)
  const employees = useEmployeeStore((s) => s.employees)
  const { getReview, saveReview, submitReview, getSubmittedCount } = useManagerReviewStore()
  const { assignments, assign, remove } = usePmAssignmentStore()

  const [tab, setTab] = useState<'results' | 'review' | 'pmAssign' | 'devReview'>('results')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!user) return null

  // 부문장(EXECUTIVE)은 같은 팀이 아니라 전사 팀장들을 평가 대상으로 봄
  const isExecutive = user.role === 'EXECUTIVE'
  const teamMembers = isExecutive
    ? employees.filter((u) => u.role === 'MANAGER' && u.id !== user.id && u.isActive)
    : employees.filter((u) => u.teamId === user.teamId && u.id !== user.id && u.isActive)

  // 개발자 PM 지정 대상: 팀원(MEMBER) 전체 (부문장이 프로젝트별 PM을 지정할 수 있는 풀)
  const developerPool = employees.filter((u) => u.role === 'MEMBER' && u.isActive)
  const potentialPms  = employees.filter((u) => u.id !== user.id && u.isActive)

  // 이 부문장이 PM을 지정해 관리 중인 개발자 목록 (평가 대상)
  const developersWithPm = developerPool.filter((d) => assignments.some((a) => a.developerId === d.id))

  const teamScores = teamMembers.map((m) => ({
    member: m,
    score: MOCK_SCORES.find((s) => s.userId === m.id) ?? null,
  })).sort((a, b) => {
    const av = a.score?.calibratedScore ?? a.score?.totalScore ?? 0
    const bv = b.score?.calibratedScore ?? b.score?.totalScore ?? 0
    return bv - av
  })

  const selected = teamScores.find((t) => t.member.id === selectedId)
  const submittedCount = getSubmittedCount(user.id)

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'results', label: '팀 평가 결과' },
    { key: 'review',  label: `팀장 총평 작성 (${submittedCount}/${teamMembers.length})` },
  ]
  if (isExecutive) {
    tabs.push({ key: 'pmAssign', label: `PM 지정 (${assignments.length})` })
    tabs.push({ key: 'devReview', label: `개발자 평가 (${developersWithPm.length})` })
  }

  return (
    <>
      <Topbar title={isExecutive ? '부문 팀장 리포트' : '팀 리포트'} subtitle={`${teamMembers.length}명`} />
      <div className="flex-1 overflow-y-auto p-7 space-y-5 max-w-5xl">

        {/* 탭 */}
        <div className="flex gap-2 border-b border-[#DDE3EE] pb-0">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === key
                  ? 'border-mint-500 text-mint-600'
                  : 'border-transparent text-[#8896A8] hover:text-[#4A5568]'
              }`}
            >{label}</button>
          ))}
        </div>

        {tab === 'results' && (
          <ResultsTab
            teamScores={teamScores}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}

        {tab === 'review' && (
          <MemberReviewPanel
            reviewerId={user.id}
            members={teamMembers}
            getReview={getReview}
            saveReview={saveReview}
            submitReview={submitReview}
          />
        )}

        {tab === 'pmAssign' && isExecutive && (
          <PmAssignTab
            developerPool={developerPool}
            potentialPms={potentialPms}
            assignments={assignments}
            onAssign={(developerId, projectName, pmId) => assign(developerId, projectName, pmId, user.id)}
            onRemove={remove}
          />
        )}

        {tab === 'devReview' && isExecutive && (
          <MemberReviewPanel
            reviewerId={user.id}
            members={developersWithPm}
            getReview={getReview}
            saveReview={saveReview}
            submitReview={submitReview}
          />
        )}
      </div>
    </>
  )
}

// ── PM 지정 탭 (개발부문장/관리자 전용) ────────────
function PmAssignTab({
  developerPool, potentialPms, assignments, onAssign, onRemove,
}: {
  developerPool: User[]
  potentialPms: User[]
  assignments: ReturnType<typeof usePmAssignmentStore.getState>['assignments']
  onAssign: (developerId: string, projectName: string, pmId: string) => void
  onRemove: (id: string) => void
}) {
  const [developerId, setDeveloperId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [pmId, setPmId] = useState('')

  function findName(id: string) {
    return developerPool.find((d) => d.id === id)?.name ?? potentialPms.find((p) => p.id === id)?.name ?? id
  }

  function handleAssign() {
    if (!developerId || !projectName.trim() || !pmId) return
    onAssign(developerId, projectName.trim(), pmId)
    setDeveloperId(''); setProjectName(''); setPmId('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl shadow-card p-5 space-y-3">
        <h3 className="font-semibold text-[#192628]">새 PM 지정</h3>
        <div>
          <label className="block text-xs font-medium text-[#4A5568] mb-1">개발자</label>
          <select value={developerId} onChange={(e) => setDeveloperId(e.target.value)}
            className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-mint-400">
            <option value="">선택하세요</option>
            {developerPool.map((d) => (
              <option key={d.id} value={d.id}>{d.name} · {d.jobDuty ?? d.jobTitle} · {d.team?.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5568] mb-1">프로젝트명</label>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)}
            placeholder="예: 신규 예약 시스템 리뉴얼"
            className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-mint-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5568] mb-1">담당 PM</label>
          <select value={pmId} onChange={(e) => setPmId(e.target.value)}
            className="w-full h-10 px-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-mint-400">
            <option value="">선택하세요</option>
            {potentialPms.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.jobTitle} · {p.team?.name ?? '미배정'}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAssign}
          disabled={!developerId || !projectName.trim() || !pmId}
          className="w-full h-10 bg-mint-500 text-white font-semibold text-sm rounded-xl disabled:opacity-40 hover:bg-mint-600 transition-colors"
        >
          PM 지정
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-5">
        <h3 className="font-semibold text-[#192628] mb-3">지정 현황 ({assignments.length}건)</h3>
        {assignments.length === 0 ? (
          <p className="text-sm text-[#8896A8] text-center py-6">아직 지정된 PM이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFD]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#0D1B2A] truncate">{findName(a.developerId)} <span className="text-[#8896A8] font-normal">— {a.projectName}</span></p>
                  <p className="text-xs text-[#8896A8]">담당 PM: {findName(a.pmId)}</p>
                </div>
                <button onClick={() => onRemove(a.id)} className="text-xs text-red-400 hover:text-red-600 flex-shrink-0 ml-3">해제</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 팀 평가 결과 탭 ────────────────────────────────
function ResultsTab({
  teamScores, selectedId, onSelect,
}: {
  teamScores: { member: User; score: (typeof MOCK_SCORES)[0] | null }[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const avgTotal = (() => {
    const vals = teamScores.map((t) => t.score?.calibratedScore ?? t.score?.totalScore).filter((v): v is number => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  })()

  return (
    <div className="space-y-5">
      {/* 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-xs text-[#8896A8] mb-1">팀 평균</p>
          <p className="text-3xl font-extrabold text-[#0D1B2A]">{avgTotal?.toFixed(2) ?? '-'}</p>
          <p className="text-xs text-[#8896A8] mt-1">/ 5.0</p>
        </div>
        {(['S','A','B'] as const).map((g) => {
          const cnt = teamScores.filter((t) => scoreToGrade(t.score?.calibratedScore ?? t.score?.totalScore ?? null) === g).length
          return (
            <div key={g} className={`rounded-2xl p-5 border ${GRADE_COLOR[g]}`}>
              <p className="text-xs font-medium mb-1">등급 {g}</p>
              <p className="text-3xl font-extrabold">{cnt}명</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 팀원 목록 */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-[#0D1B2A] mb-4">팀원 목록</h3>
          <div className="space-y-2">
            {teamScores.map(({ member, score }) => {
              const total = score?.calibratedScore ?? score?.totalScore ?? null
              const grade = scoreToGrade(total)
              return (
                <button
                  key={member.id}
                  onClick={() => onSelect(selectedId === member.id ? '' : member.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    selectedId === member.id ? 'bg-mint-50 ring-1 ring-mint-200' : 'hover:bg-[#F8FAFD]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {member.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0D1B2A] truncate">{member.name}</p>
                    <p className="text-xs text-[#8896A8] truncate">{member.jobTitle ?? '-'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-[#0D1B2A]">{total?.toFixed(1) ?? '-'}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${GRADE_COLOR[grade] ?? GRADE_COLOR['-']}`}>{grade}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 선택 상세 */}
        <div className="lg:col-span-2">
          {selectedId ? (
            (() => {
              const t = teamScores.find((x) => x.member.id === selectedId)
              return t ? <MemberDetail member={t.member} score={t.score} /> : null
            })()
          ) : (
            <div className="bg-white rounded-2xl shadow-card p-10 flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F4FA] flex items-center justify-center mb-3">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#8896A8" strokeWidth={1.5}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <p className="text-sm text-[#4A5568]">팀원을 선택하면 상세 결과를 볼 수 있습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 팀원 상세 (결과 탭) ────────────────────────────
function MemberDetail({ member, score }: { member: User; score: (typeof MOCK_SCORES)[0] | null }) {
  const surveys = MOCK_SURVEYS.filter((s) => s.targetId === member.id && s.status === 'SUBMITTED' && s.type !== 'SELF')
  const display = score?.calibratedScore ?? score?.totalScore ?? null
  const grade   = scoreToGrade(display)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {member.name.slice(0, 2)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[#0D1B2A]">{member.name}</p>
          <p className="text-xs text-[#8896A8]">{member.jobTitle} · {member.team?.name}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold text-[#0D1B2A]">{display?.toFixed(2) ?? '-'}</p>
          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border mt-1 ${GRADE_COLOR[grade] ?? GRADE_COLOR['-']}`}>
            등급 {grade}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '하향 평가', val: score?.downwardScore, color: 'text-purple-600' },
          { label: '동료 평가', val: score?.peerScore,     color: 'text-blue-600'  },
          { label: '상향 평가', val: score?.upwardScore,   color: 'text-green-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl shadow-card p-4 text-center">
            <p className="text-xs text-[#8896A8] mb-1">{item.label}</p>
            <p className={`text-2xl font-extrabold ${item.color}`}>{item.val?.toFixed(1) ?? '-'}</p>
          </div>
        ))}
      </div>

      {surveys.filter((s) => s.comment).length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h4 className="text-xs font-semibold text-[#8896A8] uppercase tracking-wide mb-3">코멘트</h4>
          <div className="space-y-2">
            {surveys.filter((s) => s.comment).map((s, i) => (
              <p key={i} className="text-sm text-[#0D1B2A] leading-relaxed py-2 border-b border-[#F0F4FA] last:border-0">{s.comment}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
