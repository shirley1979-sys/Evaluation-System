'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { MOCK_CYCLE, MOCK_NOMINATIONS, MOCK_SURVEYS, getSurveysForSurveyor } from '@/lib/mock'

const CYCLE_PHASE_KO: Record<string, string> = {
  SETUP:        '준비',
  NOMINATION:   '동료 추천',
  HR_CONFIRM:   'HR 확정',
  EVALUATION:   '평가 실시',
  CLOSED:       '마감',
  RESULTS_OPEN: '결과 공개',
}

const PHASE_STEPS = ['SETUP', 'NOMINATION', 'HR_CONFIRM', 'EVALUATION', 'CLOSED', 'RESULTS_OPEN']

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  const cycle = MOCK_CYCLE
  const cycleOpen = cycle.phase === 'EVALUATION' || cycle.phase === 'HR_CONFIRM'
  const currentStep = PHASE_STEPS.indexOf(cycle.phase)

  const mySurveys     = getSurveysForSurveyor(user.id)
  const pendingSurveys = mySurveys.filter((s) => s.status === 'DRAFT')
  const doneSurveys    = mySurveys.filter((s) => s.status === 'SUBMITTED')

  const selfSurvey = MOCK_SURVEYS.find((s) => s.surveyorId === user.id && s.type === 'SELF')
  const selfDone   = selfSurvey?.status === 'SUBMITTED'

  const myNominations  = MOCK_NOMINATIONS.filter((n) => n.nominatorId === user.id)
  const nominationDone = myNominations.length > 0

  const totalTasks  = mySurveys.length + 2 // peer/upward + self + nomination
  const doneTasks   = doneSurveys.length + (selfDone ? 1 : 0) + (nominationDone ? 1 : 0)
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const tasks = [
    {
      id: 'nomination',
      title: '동료 추천',
      desc: nominationDone ? `${myNominations.length}명 추천 완료` : '함께 일한 동료 3~7명을 추천하세요',
      href: '/nomination',
      done: nominationDone,
      icon: (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      accent: 'purple',
    },
    {
      id: 'self',
      title: '셀프 평가',
      desc: selfDone ? '제출 완료' : '본인의 역량을 자기평가하세요',
      href: '/survey/self',
      done: selfDone,
      icon: (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
      accent: 'mint',
    },
    {
      id: 'peer',
      title: '동료 평가',
      desc: pendingSurveys.filter((s) => s.type === 'PEER').length === 0
        ? '모두 완료'
        : `미완료 ${pendingSurveys.filter((s) => s.type === 'PEER').length}건`,
      href: '/survey/peer',
      done: pendingSurveys.filter((s) => s.type === 'PEER').length === 0 && doneSurveys.length > 0,
      icon: (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <polyline points="16 11 18 13 22 9"/>
        </svg>
      ),
      accent: 'teal',
    },
    {
      id: 'upward',
      title: '상향 평가',
      desc: pendingSurveys.find((s) => s.type === 'UPWARD') ? '미완료' : '완료',
      href: '/survey/upward',
      done: !pendingSurveys.find((s) => s.type === 'UPWARD') && !!mySurveys.find((s) => s.type === 'UPWARD'),
      icon: (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      ),
      accent: 'amber',
    },
  ]

  const accentMap = {
    mint:   { bg: 'bg-mint-50',   icon: 'text-mint-500',   badge: 'bg-mint-500' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', badge: 'bg-purple-500' },
    teal:   { bg: 'bg-teal-50',   icon: 'text-teal-500',   badge: 'bg-teal-500' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-500',  badge: 'bg-amber-500' },
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F0F4FA]">
      {/* 상단 히어로 배너 */}
      <div className="relative bg-[#0D1B2A] overflow-hidden">
        {/* 배경 효과 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-mint-500/8 blur-[80px] translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-mint-700/6 blur-[60px] -translate-x-1/3 translate-y-1/3" />
          <div className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 px-7 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-mint-300 tracking-wider">
                  {CYCLE_PHASE_KO[cycle.phase]} · {cycle.evalOpenAt} ~ {cycle.evalCloseAt}
                </span>
              </div>
              <h1 className="text-[24px] font-bold text-white leading-tight">
                안녕하세요, <span className="text-mint-400">{user.name}</span> 님 👋
              </h1>
              <p className="text-[13px] text-white/50 mt-1.5">
                {cycleOpen
                  ? doneTasks === totalTasks
                    ? '모든 평가를 완료했습니다. 수고 많으셨습니다!'
                    : `${totalTasks - doneTasks}가지 항목이 남아 있습니다.`
                  : '현재 평가 기간이 아닙니다.'}
              </p>
            </div>

            {/* 진행률 원형 */}
            <div className="flex-shrink-0">
              <div className="relative w-[72px] h-[72px]">
                <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                  <circle
                    cx="36" cy="36" r="30" fill="none"
                    stroke="#07BEB8" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${2 * Math.PI * 30 * (1 - progressPct / 100)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[16px] font-bold text-white">{progressPct}%</span>
                  <span className="text-[8px] text-white/40">완료</span>
                </div>
              </div>
            </div>
          </div>

          {/* 평가 사이클 스텝 */}
          <div className="flex items-center gap-1 mt-6 overflow-x-auto pb-1">
            {PHASE_STEPS.map((phase, idx) => {
              const isDone   = idx < currentStep
              const isActive = idx === currentStep
              return (
                <div key={phase} className="flex items-center gap-1 flex-shrink-0">
                  {idx > 0 && (
                    <div className={`w-5 h-px ${idx <= currentStep ? 'bg-mint-500/60' : 'bg-white/15'}`} />
                  )}
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${
                    isActive ? 'bg-mint-500/20 text-mint-300 border border-mint-400/30' :
                    isDone   ? 'bg-white/8 text-white/50' :
                               'text-white/25'
                  }`}>
                    {isDone && (
                      <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {CYCLE_PHASE_KO[phase]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-7 py-6 space-y-6">

        {/* 할 일 카드 그리드 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#192628]">평가 항목</h2>
            <span className="text-xs text-[#8896A8]">{doneTasks}/{totalTasks} 완료</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tasks.map((task) => {
              const ac = accentMap[task.accent as keyof typeof accentMap]
              return (
                <Link
                  key={task.id}
                  href={task.href}
                  className="group bg-white rounded-2xl shadow-card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl ${task.done ? 'bg-green-50' : ac.bg} flex items-center justify-center ${task.done ? 'text-green-500' : ac.icon} transition-colors`}>
                      {task.done ? (
                        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : task.icon}
                    </div>
                    {task.done && (
                      <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">완료</span>
                    )}
                  </div>
                  <h3 className="text-[13px] font-semibold text-[#192628] mb-0.5">{task.title}</h3>
                  <p className="text-[11px] text-[#8896A8] leading-relaxed">{task.desc}</p>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 미완료 평가 목록 */}
          {pendingSurveys.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#192628]">미완료 평가</h3>
                <span className="text-[11px] text-white font-semibold bg-mint-500 px-2 py-0.5 rounded-full">{pendingSurveys.length}</span>
              </div>
              <div className="space-y-1">
                {pendingSurveys.map((s) => (
                  <Link
                    key={s.id}
                    href={s.type === 'PEER' ? '/survey/peer' : '/survey/upward'}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F0F4FA] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {s.target?.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#192628]">{s.target?.name}</p>
                      <p className="text-[11px] text-[#8896A8]">
                        {s.type === 'PEER' ? '동료 평가' : '상향 평가'}
                      </p>
                    </div>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#C8D0E0" strokeWidth={2} className="group-hover:stroke-[#8896A8] flex-shrink-0">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 완료된 평가 */}
          {doneSurveys.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#192628]">완료된 평가</h3>
                <span className="text-[11px] text-green-600">{doneSurveys.length}건</span>
              </div>
              <div className="space-y-1">
                {doneSurveys.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#192628]">{s.target?.name}</p>
                      <p className="text-[11px] text-[#8896A8]">
                        {s.type === 'PEER' ? '동료 평가' : s.type === 'UPWARD' ? '상향 평가' : '하향 평가'} · 제출 완료
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 리포트 & IDP 바로가기 */}
          <div className="space-y-3">
            <Link href="/report?preview=1" className="flex items-center gap-4 bg-white rounded-2xl shadow-card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-mint-50 flex items-center justify-center text-mint-500 group-hover:bg-mint-100 transition-colors flex-shrink-0">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#192628]">내 평가 리포트</p>
                <p className="text-[11px] text-[#8896A8]">역량 레이더 차트 · 코멘트 조회</p>
              </div>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#C8D0E0" strokeWidth={2} className="group-hover:stroke-[#8896A8]">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>

            <Link href="/idp" className="flex items-center gap-4 bg-white rounded-2xl shadow-card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-100 transition-colors flex-shrink-0">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#192628]">IDP 개발 계획</p>
                <p className="text-[11px] text-[#8896A8]">목표 설정 · 진행 상태 관리</p>
              </div>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#C8D0E0" strokeWidth={2} className="group-hover:stroke-[#8896A8]">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
