'use client'

import { useState, useMemo } from 'react'
import { useAuthStore } from '@/store/auth'
import { useEmployeeStore } from '@/store/employees'
import { useNominationStore } from '@/store/nominations'
import { useEvalCycleStore } from '@/store/cycle'
import Topbar from '@/components/layout/Topbar'
import type { User, NominationGroup } from '@/types'

const MAX_TEAMMATES = 4
const MAX_COLLABS   = 4
const MAX_TOTAL     = 7
const MIN_TOTAL     = 5

// 총 인원의 50% 이상은 타부서(협업) 동료여야 함
function minCollabRequired(total: number) {
  return Math.ceil(total / 2)
}

export default function NominationPage() {
  const user = useAuthStore((s) => s.user)
  const allEmployees = useEmployeeStore((s) => s.employees)
  const { phase } = useEvalCycleStore()
  const { getEntry, submitEntry, getPendingApprovalsFor, respondToNomination } = useNominationStore()

  const myEntry = user ? getEntry(user.id) : undefined
  const pendingApprovals = user ? getPendingApprovalsFor(user.id) : []

  // 초기 선택: 기존 제출 데이터에서
  const [selected, setSelected] = useState<{ id: string; group: NominationGroup }[]>(
    () => myEntry?.nominees.map((n) => ({ id: n.userId, group: n.group })) ?? []
  )
  const [submitted, setSubmitted] = useState(() => !!myEntry && myEntry.status !== 'NONE')
  const [search, setSearch] = useState('')

  if (!user) return null

  const myTeamId   = user.teamId
  // 부문장/실장(EXECUTIVE)은 동급 평가자로만 존재하며 평가 대상 후보에서 제외
  const allOthers  = allEmployees.filter((u) => u.id !== user.id && u.isActive && u.role !== 'EXECUTIVE')
  const filtered   = useMemo(
    () => allOthers.filter((e) => e.name.includes(search) || (e.team?.name ?? '').includes(search) || (e.jobTitle ?? '').includes(search)),
    [search, allOthers]
  )
  const myTeammates = filtered.filter((e) => e.teamId === myTeamId)
  const otherTeam   = filtered.filter((e) => e.teamId !== myTeamId)

  const teammates = selected.filter((s) => s.group === 'TEAMMATE')
  const collabs   = selected.filter((s) => s.group === 'COLLAB')
  const total     = selected.length
  const collabRequired = minCollabRequired(total)
  const collabOk  = collabs.length >= collabRequired
  const canSubmit = total >= MIN_TOTAL && total <= MAX_TOTAL && collabOk

  function toggle(userId: string, group: NominationGroup) {
    if (submitted) return
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === userId)
      if (exists) return prev.filter((s) => s.id !== userId)
      if (group === 'TEAMMATE' && teammates.length >= MAX_TEAMMATES) return prev
      if (group === 'COLLAB'   && collabs.length   >= MAX_COLLABS)   return prev
      if (total >= MAX_TOTAL) return prev
      return [...prev, { id: userId, group }]
    })
  }

  function handleSubmit() {
    if (!user || !canSubmit) return
    submitEntry(user.id, selected.map((s) => ({ userId: s.id, group: s.group })))
    setSubmitted(true)
  }

  // 부문장/관리자 확정 이후 → 안내 화면
  const entry = getEntry(user.id)
  const isConfirmed = entry?.status === 'CONFIRMED'

  if (isConfirmed) {
    return (
      <ConfirmedView
        entry={entry}
        allEmployees={allEmployees}
        pendingApprovals={pendingApprovals}
        onRespond={(nominatorId, approval, reason) => user && respondToNomination(nominatorId, user.id, approval, reason)}
      />
    )
  }

  return (
    <>
      <Topbar title="동료 추천" subtitle={`${total}/${MAX_TOTAL}명 선택`} />
      <div className="flex-1 overflow-y-auto p-7 space-y-5 max-w-2xl">

        {/* 나를 지정한 동료 요청 — 승인/거절 */}
        {pendingApprovals.length > 0 && (
          <PendingApprovalsCard
            approvals={pendingApprovals}
            allEmployees={allEmployees}
            onRespond={(nominatorId, approval, reason) => user && respondToNomination(nominatorId, user.id, approval, reason)}
          />
        )}

        {/* 평가 유형 안내 */}
        <EvalTypeGuide />

        {/* 동료 추천 선정 방법 및 승인·거절 안내 */}
        <NominationGuide />

        {/* 단계 안내 배너 */}
        {phase !== 'NOMINATION' && phase !== 'SETUP' && !submitted && (
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            현재는 동료 추천 기간이 아닙니다. 추천 기간: 사이클 NOMINATION 단계
          </div>
        )}

        {/* HR 검토 대기 */}
        {submitted && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#0D1B2A]">부문장 검토 대기 중</p>
              <p className="text-xs text-[#4A5568] mt-0.5">
                추천이 제출되었습니다. 부문장(또는 관리자)이 명단을 검토·확정하면, 지정된 동료에게 승인 요청이 전달됩니다.
              </p>
              <button onClick={() => setSubmitted(false)} className="mt-2 text-xs text-blue-500 hover:underline">
                수정하기
              </button>
            </div>
          </div>
        )}

        {/* 선택 현황 */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#0D1B2A] text-sm">
              선택한 동료 <span className="text-mint-600">{total}</span>/{MAX_TOTAL}
            </h3>
            <div className="flex gap-3 text-xs text-[#8896A8]">
              <span>팀원 {teammates.length}/{MAX_TEAMMATES}</span>
              <span>협업 {collabs.length}/{MAX_COLLABS}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 min-h-10 mb-4">
            {selected.map(({ id, group }) => {
              const emp = allEmployees.find((e) => e.id === id)
              if (!emp) return null
              const approval = myEntry?.nominees.find((n) => n.userId === id)?.approval
              const approvalLabel = approval === 'APPROVED' ? '승인됨' : approval === 'DECLINED' ? '거절됨' : submitted ? '승인 대기' : null
              const declineReason = myEntry?.nominees.find((n) => n.userId === id)?.declineReason
              return (
                <span
                  key={id}
                  title={declineReason ? `거절 사유: ${declineReason}` : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  group === 'TEAMMATE' ? 'bg-mint-50 border-mint-200 text-mint-700' : 'bg-purple-50 border-purple-200 text-purple-700'
                }`}>
                  {emp.name}
                  <span className="opacity-50 text-[10px]">{group === 'TEAMMATE' ? '팀원' : '협업'}</span>
                  {approvalLabel && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      approval === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      approval === 'DECLINED' ? 'bg-red-100 text-red-700' : 'bg-white/60 text-amber-700'
                    }`}>{approvalLabel}</span>
                  )}
                  {!submitted && (
                    <button onClick={() => toggle(id, group)} className="hover:opacity-70 font-bold leading-none ml-0.5">×</button>
                  )}
                </span>
              )
            })}
            {selected.length === 0 && <span className="text-sm text-[#8896A8]">아래 목록에서 동료를 선택하세요 (최소 {MIN_TOTAL}명)</span>}
          </div>

          {/* 거절 사유 목록 */}
          {myEntry?.nominees.some((n) => n.approval === 'DECLINED') && (
            <div className="mb-4 space-y-1.5">
              {myEntry.nominees.filter((n) => n.approval === 'DECLINED').map((n) => {
                const emp = allEmployees.find((e) => e.id === n.userId)
                return (
                  <p key={n.userId} className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <strong>{emp?.name ?? '알 수 없음'}</strong>님이 거절했습니다{n.declineReason ? ` — "${n.declineReason}"` : ''}. 부문장 또는 관리자에게 문의해 다른 동료로 교체해주세요.
                  </p>
                )
              })}
            </div>
          )}

          {/* 진행 바 */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-mint-500 rounded-full transition-all" style={{ width: `${(total / MAX_TOTAL) * 100}%` }} />
          </div>

          {!submitted && total > 0 && !collabOk && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              타부서(협업) 동료는 전체의 50% 이상이어야 합니다 — 현재 {collabs.length}/{total}명, 최소 {collabRequired}명 필요
            </p>
          )}

          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full h-11 bg-mint-500 text-white font-semibold text-sm rounded-xl disabled:opacity-40 hover:bg-mint-600 transition-colors"
            >
              {total < MIN_TOTAL
                ? `최소 ${MIN_TOTAL}명 이상 선택하세요 (${total}/${MIN_TOTAL})`
                : !collabOk
                  ? `타부서 동료를 ${collabRequired - collabs.length}명 더 선택하세요`
                  : `추천 제출 — ${total}명 선택됨`}
            </button>
          )}
        </div>

        {/* 검색 */}
        {!submitted && (
          <>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8896A8]" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름 · 팀 · 직책으로 검색"
                className="w-full h-11 pl-10 pr-4 bg-white border border-[#DDE3EE] rounded-xl text-sm focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100"
              />
            </div>
            <EmployeeSection
              title="같은 팀 동료"
              group="TEAMMATE"
              employees={myTeammates}
              selected={selected}
              onToggle={toggle}
              max={MAX_TEAMMATES}
              current={teammates.length}
            />
            <EmployeeSection
              title="협업 부서 / 타팀"
              group="COLLAB"
              employees={otherTeam}
              selected={selected}
              onToggle={toggle}
              max={MAX_COLLABS}
              current={collabs.length}
            />
          </>
        )}
      </div>
    </>
  )
}

// ─── 부문장/관리자 확정 후 안내 화면 ─────────────────────
function ConfirmedView({ entry, allEmployees, pendingApprovals, onRespond }: {
  entry: ReturnType<typeof useNominationStore.getState>['entries'][number]
  allEmployees: User[]
  pendingApprovals: { nominatorId: string; group: NominationGroup }[]
  onRespond: (nominatorId: string, approval: 'APPROVED' | 'DECLINED', reason?: string) => void
}) {
  return (
    <>
      <Topbar title="동료 추천" subtitle="최종 확정 완료" />
      <div className="flex-1 overflow-y-auto p-7 space-y-5 max-w-2xl">

        {/* 나를 지정한 동료 요청 — 승인/거절 (내 추천이 확정된 후에도 계속 표시) */}
        {pendingApprovals.length > 0 && (
          <PendingApprovalsCard
            approvals={pendingApprovals}
            allEmployees={allEmployees}
            onRespond={onRespond}
          />
        )}

        {/* 완료 배너 */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-800">동료 추천 최종 확정</p>
              <p className="text-xs text-green-600 mt-0.5">부문장(또는 관리자)이 검토하여 아래 {entry.nominees.length}명의 동료 평가가 확정되었습니다. 이제 지정된 동료가 직접 승인/거절합니다.</p>
            </div>
          </div>
        </div>

        {/* 동료 추천 선정 방법 및 승인·거절 안내 */}
        <NominationGuide />

        {/* 익명성 안내 */}
        <div className="bg-[#F8FAFD] border border-[#DDE3EE] rounded-2xl p-5">
          <h3 className="font-semibold text-[#0D1B2A] mb-3 flex items-center gap-2">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#07BEB8" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            익명 평가 안내
          </h3>
          <div className="space-y-2 text-sm text-[#4A5568]">
            <div className="flex gap-2"><span className="text-mint-500 font-bold">•</span><span>모든 동료 평가는 <strong>완전 익명</strong>으로 처리됩니다</span></div>
            <div className="flex gap-2"><span className="text-mint-500 font-bold">•</span><span>평가자 정보는 HR 담당자에게도 공개되지 않습니다</span></div>
            <div className="flex gap-2"><span className="text-mint-500 font-bold">•</span><span>응답자가 <strong>2명 미만</strong>이면 코멘트가 비공개 처리됩니다</span></div>
            <div className="flex gap-2"><span className="text-mint-500 font-bold">•</span><span>솔직하고 건설적인 피드백이 동료의 성장에 도움이 됩니다</span></div>
          </div>
        </div>

        {/* 확정된 평가 대상 목록 */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-[#0D1B2A] mb-4">확정된 평가 대상 ({entry.nominees.length}명)</h3>
          <div className="space-y-2">
            {entry.nominees.map(({ userId, group, approval }) => {
              const emp = allEmployees.find((e) => e.id === userId)
              if (!emp) return null
              return (
                <div key={userId} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFD]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {emp.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0D1B2A]">{emp.name}</p>
                    <p className="text-xs text-[#8896A8]">{emp.jobTitle} · {emp.team?.name}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    approval === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    approval === 'DECLINED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {approval === 'APPROVED' ? '승인됨' : approval === 'DECLINED' ? '거절됨' : '승인 대기'}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    group === 'TEAMMATE' ? 'bg-mint-50 border-mint-200 text-mint-700' : 'bg-purple-50 border-purple-200 text-purple-700'
                  }`}>
                    {group === 'TEAMMATE' ? '팀원' : '협업'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-mint-50 border border-mint-200 rounded-xl p-4 text-sm text-mint-700">
          이제 동료 평가를 진행하세요. <a href="/survey/peer" className="font-semibold underline">동료 평가 바로가기 →</a>
        </div>
      </div>
    </>
  )
}

// ─── 나를 지정한 동료 요청 (승인/거절) ────────────
function PendingApprovalsCard({ approvals, allEmployees, onRespond }: {
  approvals: { nominatorId: string; group: NominationGroup }[]
  allEmployees: User[]
  onRespond: (nominatorId: string, approval: 'APPROVED' | 'DECLINED', reason?: string) => void
}) {
  const [decliningId, setDecliningId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  function confirmDecline(nominatorId: string) {
    onRespond(nominatorId, 'DECLINED', reason.trim() || undefined)
    setDecliningId(null)
    setReason('')
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <h3 className="font-semibold text-amber-800 text-sm mb-1">나를 동료로 지정한 요청 ({approvals.length}건)</h3>
      <p className="text-xs text-amber-700 mb-3">아래 동료가 나를 다면평가 대상으로 지정했습니다. 평가받는 것에 동의하는지 확인해주세요.</p>
      <div className="space-y-2">
        {approvals.map(({ nominatorId, group }) => {
          const nominator = allEmployees.find((e) => e.id === nominatorId)
          if (!nominator) return null
          const isDeclining = decliningId === nominatorId
          return (
            <div key={nominatorId} className="bg-white border border-amber-100 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {nominator.name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#0D1B2A]">{nominator.name}</p>
                  <p className="text-xs text-[#8896A8]">{nominator.jobTitle} · {nominator.team?.name} · {group === 'TEAMMATE' ? '같은 팀' : '협업 부서'} 동료로 지정</p>
                </div>
                {!isDeclining && (
                  <>
                    <button
                      onClick={() => { setDecliningId(nominatorId); setReason('') }}
                      className="text-xs font-semibold text-[#8896A8] hover:text-red-500 border border-[#DDE3EE] px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >거절</button>
                    <button
                      onClick={() => onRespond(nominatorId, 'APPROVED')}
                      className="text-xs font-semibold text-white bg-mint-500 hover:bg-mint-600 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >승인</button>
                  </>
                )}
              </div>
              {isDeclining && (
                <div className="mt-2.5 pl-11">
                  <label className="block text-[11px] font-medium text-[#8896A8] mb-1">거절 사유 (선택 · 예: 같이 협업한 경험이 없어 평가하기 어렵습니다)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    autoFocus
                    placeholder="거절 사유를 입력하세요"
                    className="w-full px-3 py-2 border border-[#DDE3EE] rounded-lg text-xs resize-none focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  />
                  <div className="flex gap-2 mt-2 justify-end">
                    <button
                      onClick={() => { setDecliningId(null); setReason('') }}
                      className="text-xs font-medium text-[#8896A8] hover:text-[#4A5568] px-3 py-1.5 rounded-lg transition-colors"
                    >취소</button>
                    <button
                      onClick={() => confirmDecline(nominatorId)}
                      className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                    >거절 확정</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── 평가 유형 안내 ────────────────────────────
function EvalTypeGuide() {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-mint-50 flex items-center justify-center">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#07BEB8" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-[#192628]">다면평가 안내 — 어떤 평가를 받게 되나요?</span>
        </div>
        <svg className={`text-[#8896A8] transition-transform ${open ? 'rotate-180' : ''}`} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-[#F0F4FA]">
          {[
            {
              icon: '⬆️', title: '상향 평가',
              desc: '직속 팀장(관리자)을 평가합니다. 리더십, 심리적 안전, 지원, 공정성을 평가하며 완전 익명입니다.',
              note: '응답자 3명 미만 시 코멘트 비공개',
              color: 'bg-amber-50 border-amber-100',
            },
            {
              icon: '⬇️', title: '하향 평가',
              desc: '팀장이 직속 팀원을 평가합니다. 업무 성과, 협업, 성장 역량을 중심으로 평가합니다.',
              note: '팀장만 해당',
              color: 'bg-purple-50 border-purple-100',
            },
            {
              icon: '↔️', title: '동료 평가',
              desc: '내가 추천한 동료들을 평가합니다. 신뢰, 기여, 전문성 공유 등을 익명으로 평가합니다.',
              note: '응답자 2명 미만 시 코멘트 비공개',
              color: 'bg-mint-50 border-mint-100',
            },
          ].map((item) => (
            <div key={item.title} className={`rounded-xl border p-4 ${item.color}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span>{item.icon}</span>
                <span className="text-sm font-semibold text-[#192628]">{item.title}</span>
                <span className="text-[10px] text-[#8896A8] bg-white border border-[#DDE3EE] px-2 py-0.5 rounded-full ml-auto">{item.note}</span>
              </div>
              <p className="text-xs text-[#4A5568] leading-relaxed">{item.desc}</p>
            </div>
          ))}

          <div className="rounded-xl bg-[#F0F4FA] p-3 text-xs text-[#4A5568] space-y-2">
            <p><strong>동료 추천 규칙:</strong> 총 5~7명을 추천하며, 이 중 <strong>타부서(협업) 동료가 50% 이상</strong>이어야 합니다 (같은 팀원·협업 부서 각 최대 4명).</p>
            <p><strong>진행 순서:</strong> ① 본인이 5~7명 추천·제출 → ② 부문장(또는 관리자)이 명단을 검토하고 확정 (필요 시 재배치) → ③ 확정된 명단의 동료 본인에게 승인/거절 요청 전달 → ④ 동료가 승인하면 해당 동료 평가가 시작되고, 거절하면 사유와 함께 부문장/관리자가 재배치를 검토합니다.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 동료 추천 선정 방법 및 승인·거절 프로세스 안내 ────────
function NominationGuide() {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-mint-50 flex items-center justify-center">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#07BEB8" strokeWidth={2}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-[#192628]">동료 추천, 어떻게 선정하고 승인/거절하나요?</span>
        </div>
        <svg className={`text-[#8896A8] transition-transform ${open ? 'rotate-180' : ''}`} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#F0F4FA] text-sm text-[#4A5568]">

          <div className="pt-1">
            <p className="font-semibold text-[#192628] mb-1.5">① 선정 방법</p>
            <ul className="space-y-1 pl-4 list-disc marker:text-mint-400">
              <li>본인의 업무를 가장 잘 알고, 함께 협업한 동료 <strong>5~7명</strong>을 직접 선택합니다.</li>
              <li>같은 팀 동료(팀원)와 협업 부서(타팀) 동료를 각각 최대 4명까지 선택할 수 있습니다.</li>
              <li>공정한 평가를 위해 <strong>타부서(협업) 동료가 전체의 50% 이상</strong>이어야 합니다 (예: 6명 추천 시 최소 3명은 타부서).</li>
              <li>단순 친분이 아닌, 실제 업무·프로젝트에서 함께 일한 경험을 기준으로 선택해주세요.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-[#192628] mb-1.5">② 진행 순서</p>
            <ol className="space-y-1 pl-4 list-decimal marker:text-mint-500 marker:font-semibold">
              <li>본인이 동료 5~7명을 선택해 <strong>제출</strong>합니다.</li>
              <li><strong>부문장(또는 관리자)</strong>이 명단의 적절성을 검토하고 <strong>확정</strong>합니다. 필요 시 다른 동료로 재배치할 수 있습니다.</li>
              <li>확정되면 지정된 동료 본인에게 <strong>승인/거절 요청</strong>이 전달됩니다.</li>
              <li>동료가 <strong>승인</strong>하면 해당 동료 평가(서술형 코멘트 필수)가 시작됩니다.</li>
            </ol>
          </div>

          <div>
            <p className="font-semibold text-[#192628] mb-1.5">③ 거절 시 처리</p>
            <ul className="space-y-1 pl-4 list-disc marker:text-red-400">
              <li>함께 협업한 경험이 없거나 평가하기 어려운 경우, <strong>사유를 기재</strong>하고 거절할 수 있습니다.</li>
              <li>거절되면 해당 동료는 평가 대상에서 제외되고, 사유와 함께 부문장/관리자에게 전달됩니다.</li>
              <li>부문장(또는 관리자)이 명단을 검토해 다른 동료로 재배치하며, 재배치된 명단도 동일한 승인 절차를 거칩니다.</li>
            </ul>
          </div>

          <p className="text-xs text-[#8896A8] pt-1 border-t border-[#F0F4FA]">
            모든 동료 평가는 완전 익명으로 진행되며, 평가자 정보는 공개되지 않습니다.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── 직원 목록 섹션 ────────────────────────────
function EmployeeSection({ title, group, employees, selected, onToggle, max, current }: {
  title: string; group: NominationGroup; employees: User[]
  selected: { id: string; group: string }[]
  onToggle: (id: string, group: NominationGroup) => void
  max: number; current: number
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
          const maxReached = !isSelected && current >= max
          return (
            <button
              key={emp.id}
              onClick={() => onToggle(emp.id, group)}
              disabled={maxReached}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-mint-50 border border-mint-200'
                  : maxReached
                    ? 'opacity-40 cursor-not-allowed border border-transparent'
                    : 'hover:bg-[#F0F4FA] border border-transparent'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                isSelected ? 'bg-gradient-to-br from-mint-500 to-mint-700' : 'bg-gradient-to-br from-gray-300 to-gray-400'
              }`}>
                {emp.name.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#0D1B2A]">{emp.name}</p>
                <p className="text-xs text-[#8896A8]">{emp.jobTitle} · {emp.team?.name ?? '미배정'}</p>
              </div>
              {isSelected && (
                <svg className="text-mint-500 flex-shrink-0" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          )
        })}
        {employees.length === 0 && (
          <p className="text-sm text-center text-[#8896A8] py-4">검색 결과가 없습니다</p>
        )}
      </div>
    </div>
  )
}
