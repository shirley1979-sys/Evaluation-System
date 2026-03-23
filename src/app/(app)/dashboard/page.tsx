'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { MOCK_CYCLE, MOCK_NOMINATIONS, MOCK_SURVEYS, getSurveysForSurveyor } from '@/lib/mock'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  const cycle = MOCK_CYCLE
  const cycleOpen = cycle.phase === 'EVALUATION' || cycle.phase === 'HR_CONFIRM'

  const mySurveys = getSurveysForSurveyor(user.id)
  const pendingSurveys = mySurveys.filter((s) => s.status === 'DRAFT')

  const selfSurvey = MOCK_SURVEYS.find((s) => s.surveyorId === user.id && s.type === 'SELF')
  const selfDone = selfSurvey?.status === 'SUBMITTED'

  const myNominations = MOCK_NOMINATIONS.filter((n) => n.nominatorId === user.id)
  const nominationDone = myNominations.length > 0

  return (
    <>
      <Topbar title="대시보드" subtitle="내 평가 현황" cycleOpen={cycleOpen} />
      <div className="flex-1 overflow-y-auto p-7">

        {/* 환영 배너 */}
        <div className="relative bg-gradient-to-br from-[#0D1B2A] to-[#162438] rounded-2xl p-6 mb-6 text-white overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 50%, rgba(37,99,235,.2) 0%, transparent 60%)' }} />
          <div className="relative z-10">
            <p className="text-white/55 text-sm mb-1">안녕하세요,</p>
            <h2 className="text-2xl font-bold mb-2">{user.name} 님 👋</h2>
            <p className="text-white/65 text-sm">
              {cycleOpen
                ? `미완료 평가 ${pendingSurveys.length + (selfDone ? 0 : 1)}건이 남아 있습니다.`
                : '현재 평가 기간이 아닙니다.'}
            </p>
            <div className="flex gap-2 mt-3">
              <span className="text-[10px] font-semibold bg-white/10 border border-white/15 px-2.5 py-1 rounded-full">
                평가 기간: {cycle.evalOpenAt} ~ {cycle.evalCloseAt}
              </span>
            </div>
          </div>
        </div>

        {/* 할 일 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <TaskCard
            title="셀프 평가"
            desc={selfDone ? '제출 완료' : '본인의 역량을 자기평가하세요'}
            href="/survey/self"
            done={selfDone}
            icon="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"
            color="blue"
          />
          <TaskCard
            title="동료 추천"
            desc={nominationDone ? `${myNominations.length}명 추천 완료` : '함께 일한 동료를 추천하세요'}
            href="/nomination"
            done={nominationDone}
            icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            color="purple"
          />
          <TaskCard
            title="동료 평가"
            desc={pendingSurveys.length === 0 ? '모두 완료' : `미완료 ${pendingSurveys.length}건`}
            href="/survey/peer"
            done={pendingSurveys.length === 0}
            icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
            color="green"
          />
        </div>

        {/* 미완료 평가 목록 */}
        {pendingSurveys.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
            <h3 className="text-sm font-semibold text-[#0D1B2A] mb-3">미완료 평가</h3>
            <div className="space-y-1.5">
              {pendingSurveys.map((s) => (
                <Link
                  key={s.id}
                  href={s.type === 'PEER' ? '/survey/peer' : '/survey/upward'}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F4FA] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {s.target?.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0D1B2A]">{s.target?.name}</p>
                    <p className="text-xs text-[#8896A8]">
                      {s.type === 'PEER' ? '동료 평가' : s.type === 'UPWARD' ? '상향 평가' : '하향 평가'}
                    </p>
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#C8D0E0" strokeWidth={2} className="group-hover:stroke-[#8896A8]">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 최근 완료 */}
        {mySurveys.filter((s) => s.status === 'SUBMITTED').length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="text-sm font-semibold text-[#0D1B2A] mb-3">완료된 평가</h3>
            <div className="space-y-1.5">
              {mySurveys.filter((s) => s.status === 'SUBMITTED').map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0D1B2A]">{s.target?.name}</p>
                    <p className="text-xs text-[#8896A8]">
                      {s.type === 'PEER' ? '동료 평가' : s.type === 'UPWARD' ? '상향 평가' : '하향 평가'} · 제출 완료
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function TaskCard({ title, desc, href, done, icon, color }: {
  title: string; desc: string; href: string; done: boolean; icon: string; color: 'blue' | 'purple' | 'green'
}) {
  const gradients = {
    blue:   'from-blue-500/8 to-blue-600/4 border-blue-100 hover:border-blue-200',
    purple: 'from-purple-500/8 to-purple-600/4 border-purple-100 hover:border-purple-200',
    green:  'from-green-500/8 to-green-600/4 border-green-100 hover:border-green-200',
  }
  const iconColors = { blue: 'text-blue-600', purple: 'text-purple-600', green: 'text-green-600' }

  return (
    <Link href={href} className={`block p-5 rounded-2xl border bg-gradient-to-br ${gradients[color]} hover:shadow-card transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={iconColors[color]}>
          <path d={icon}/>
        </svg>
        {done && (
          <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">완료</span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-[#0D1B2A] mb-1">{title}</h3>
      <p className="text-xs text-[#8896A8]">{desc}</p>
    </Link>
  )
}
