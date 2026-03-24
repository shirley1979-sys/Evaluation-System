'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { useEmployeeStore } from '@/store/employees'
import { useManagerReviewStore, REVIEW_CATEGORIES, emptyReview, type MemberReview } from '@/store/managerReview'
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

  const [tab, setTab]             = useState<'results' | 'review'>('results')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!user) return null

  const teamMembers = employees.filter(
    (u) => u.teamId === user.teamId && u.id !== user.id && u.isActive
  )

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

  return (
    <>
      <Topbar title="팀 리포트" subtitle={`${teamMembers.length}명`} />
      <div className="flex-1 overflow-y-auto p-7 space-y-5 max-w-5xl">

        {/* 탭 */}
        <div className="flex gap-2 border-b border-[#DDE3EE] pb-0">
          {[
            { key: 'results', label: '팀 평가 결과' },
            { key: 'review',  label: `팀장 총평 작성 (${submittedCount}/${teamMembers.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
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
          <ReviewTab
            managerId={user.id}
            teamMembers={teamMembers}
            getReview={getReview}
            saveReview={saveReview}
            submitReview={submitReview}
          />
        )}
      </div>
    </>
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

// ── 팀장 총평 작성 탭 ──────────────────────────────
function ReviewTab({
  managerId, teamMembers, getReview, saveReview, submitReview,
}: {
  managerId: string
  teamMembers: User[]
  getReview: (managerId: string, targetId: string) => MemberReview | undefined
  saveReview: (managerId: string, review: MemberReview) => void
  submitReview: (managerId: string, targetId: string) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(teamMembers[0]?.id ?? null)
  const [form, setForm] = useState<MemberReview>(() =>
    selectedId ? (getReview(managerId, selectedId) ?? emptyReview(selectedId)) : emptyReview('')
  )
  const [saveMsg, setSaveMsg] = useState('')

  function selectMember(id: string) {
    setSelectedId(id)
    setForm(getReview(managerId, id) ?? emptyReview(id))
  }

  function handleSave() {
    if (!selectedId) return
    saveReview(managerId, { ...form, targetId: selectedId })
    setSaveMsg('저장되었습니다')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  function handleSubmit() {
    if (!selectedId) return
    if (!window.confirm('이 팀원의 총평을 최종 제출하시겠습니까?')) return
    saveReview(managerId, { ...form, targetId: selectedId })
    submitReview(managerId, selectedId)
    setForm((prev) => ({ ...prev, submitted: true }))
  }

  const isSubmitted = form.submitted

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
      {/* 팀원 목록 */}
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-card p-4">
        <p className="text-xs font-semibold text-[#8896A8] uppercase tracking-wide mb-3">팀원 선택</p>
        <div className="space-y-1">
          {teamMembers.map((m) => {
            const review = getReview(managerId, m.id)
            const done   = review?.submitted
            return (
              <button
                key={m.id}
                onClick={() => selectMember(m.id)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-colors ${
                  selectedId === m.id ? 'bg-mint-50 ring-1 ring-mint-200' : 'hover:bg-[#F8FAFD]'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {m.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#192628] truncate">{m.name}</p>
                  <p className="text-[10px] text-[#8896A8] truncate">{m.jobTitle ?? '-'}</p>
                </div>
                {done
                  ? <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full flex-shrink-0">완료</span>
                  : review?.savedAt
                    ? <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0">임시</span>
                    : null
                }
              </button>
            )
          })}
        </div>
      </div>

      {/* 총평 작성 폼 */}
      <div className="lg:col-span-3">
        {selectedId ? (
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#192628]">
                  {teamMembers.find((m) => m.id === selectedId)?.name} 총평
                </h3>
                <p className="text-xs text-[#8896A8] mt-0.5">
                  {teamMembers.find((m) => m.id === selectedId)?.jobTitle} · {teamMembers.find((m) => m.id === selectedId)?.team?.name}
                </p>
              </div>
              {isSubmitted && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                  제출 완료
                </span>
              )}
            </div>

            {/* 카테고리별 척도 + 서술 */}
            {REVIEW_CATEGORIES.map(({ key, label, scoreKey }) => (
              <div key={key} className="border border-[#DDE3EE] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#192628]">{label}</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        disabled={isSubmitted}
                        onClick={() => setForm((f) => ({ ...f, [scoreKey]: v }))}
                        className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${
                          form[scoreKey as keyof MemberReview] === v
                            ? 'bg-mint-500 border-mint-500 text-white'
                            : 'border-[#DDE3EE] text-[#4A5568] hover:border-mint-300 hover:bg-mint-50 disabled:cursor-default'
                        }`}
                      >{v}</button>
                    ))}
                    <span className="text-xs text-[#8896A8] self-center ml-1">/ 5</span>
                  </div>
                </div>
                <textarea
                  value={form[key as keyof MemberReview] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  disabled={isSubmitted}
                  rows={2}
                  placeholder={`${label}에 대한 구체적인 의견을 작성하세요`}
                  className="w-full px-3 py-2.5 border border-[#DDE3EE] rounded-lg text-sm resize-none focus:outline-none focus:border-mint-400 disabled:bg-gray-50"
                />
              </div>
            ))}

            {/* 종합 의견 */}
            <div>
              <label className="block text-sm font-semibold text-[#192628] mb-2">종합 의견</label>
              <textarea
                value={form.overall}
                onChange={(e) => setForm((f) => ({ ...f, overall: e.target.value }))}
                disabled={isSubmitted}
                rows={4}
                placeholder="팀원의 전반적인 역량, 성과, 성장 방향에 대해 종합적으로 작성하세요"
                className="w-full px-4 py-3 border border-[#DDE3EE] rounded-xl text-sm resize-none focus:outline-none focus:border-mint-400 disabled:bg-gray-50"
              />
            </div>

            {/* 버튼 */}
            {!isSubmitted && (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 h-10 border border-mint-300 text-mint-600 font-semibold text-sm rounded-xl hover:bg-mint-50 transition-colors"
                >임시 저장</button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 h-10 bg-mint-500 text-white font-semibold text-sm rounded-xl hover:bg-mint-600 transition-colors"
                >최종 제출</button>
              </div>
            )}
            {saveMsg && <p className="text-center text-xs text-green-600 font-medium">{saveMsg}</p>}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-card p-10 text-center">
            <p className="text-sm text-[#8896A8]">왼쪽에서 팀원을 선택하세요</p>
          </div>
        )}
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
