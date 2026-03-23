'use client'

import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import RadarChart from '@/components/report/RadarChart'
import { MOCK_CYCLE, MOCK_SCORES, MOCK_SURVEYS, MOCK_QUESTIONS } from '@/lib/mock'
import { scoreToGrade, calcCategoryScores, canShowPeerComments, canShowUpwardComments } from '@/lib/score'

export default function ReportPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  const cycle = MOCK_CYCLE

  if (cycle.phase !== 'RESULTS_OPEN') {
    return (
      <>
        <Topbar title="내 리포트" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-[#0D1B2A] text-lg mb-1">아직 결과가 공개되지 않았습니다</p>
            <p className="text-sm text-[#8896A8]">평가 종료 후 HR에서 결과를 공개합니다</p>
            <div className="mt-4 text-xs text-[#8896A8] bg-[#F0F4FA] rounded-xl px-4 py-3">
              현재 단계: <strong className="text-[#4A5568]">{cycle.phase}</strong> · 마감: {cycle.evalCloseAt}
            </div>
            {/* 데모용: 리포트 미리보기 버튼 */}
            <button
              onClick={() => window.location.href = '/report?preview=1'}
              className="mt-4 text-sm text-blue-600 underline"
            >
              리포트 미리보기 (데모)
            </button>
          </div>
        </div>
      </>
    )
  }

  return <ReportContent userId={user.id} />
}

function ReportContent({ userId }: { userId: string }) {
  const score = MOCK_SCORES.find((s) => s.userId === userId)
  const receivedSurveys = MOCK_SURVEYS.filter(
    (s) => s.targetId === userId && s.status === 'SUBMITTED' && s.type !== 'SELF'
  )

  const peerSurveys   = receivedSurveys.filter((s) => s.type === 'PEER')
  const upwardSurveys = receivedSurveys.filter((s) => s.type === 'UPWARD')

  // 카테고리별 점수
  const allAnswers = receivedSurveys.flatMap((s) =>
    s.answers.map((a) => ({
      score: a.score,
      question: MOCK_QUESTIONS.find((q) => q.id === a.questionId)!,
    })).filter((a) => a.question)
  )
  const categoryScores = calcCategoryScores(allAnswers)

  const peerComments   = canShowPeerComments(peerSurveys.length)   ? peerSurveys.map((s) => s.comment).filter(Boolean)   : []
  const upwardComments = canShowUpwardComments(upwardSurveys.length) ? upwardSurveys.map((s) => s.comment).filter(Boolean) : []

  const total = score?.calibratedScore ?? score?.totalScore ?? null
  const grade = scoreToGrade(total)

  return (
    <>
      <Topbar title="내 리포트" subtitle="2026년 다면평가 결과" />
      <div className="flex-1 overflow-y-auto p-7">
        <div className="max-w-3xl space-y-5">

          {/* 종합 점수 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ScoreCard label="종합 점수" value={total} grade={grade} highlight />
            <ScoreCard label="팀장 평가" value={score?.downwardScore ?? null} grade={scoreToGrade(score?.downwardScore ?? null)} />
            <ScoreCard label="동료 평가" value={score?.peerScore ?? null} grade={scoreToGrade(score?.peerScore ?? null)} />
            <ScoreCard label="상향 평가" value={score?.upwardScore ?? null} grade={scoreToGrade(score?.upwardScore ?? null)} />
          </div>

          {/* 레이더 차트 */}
          {categoryScores.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-semibold text-[#0D1B2A] mb-4">역량별 점수</h3>
              <RadarChart data={categoryScores} />
            </div>
          )}

          {/* 강점 / 개발 영역 */}
          {categoryScores.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <StrengthCard
                title="상위 강점"
                items={[...categoryScores].sort((a, b) => b.avg - a.avg).slice(0, 3)}
                type="strength"
              />
              <StrengthCard
                title="개발 필요 역량"
                items={[...categoryScores].sort((a, b) => a.avg - b.avg).slice(0, 3)}
                type="improve"
              />
            </div>
          )}

          {/* 익명 코멘트 */}
          <CommentsSection title="동료 피드백" comments={peerComments} count={peerSurveys.length} minCount={2} />
          <CommentsSection title="상향 피드백" comments={upwardComments} count={upwardSurveys.length} minCount={3} />
        </div>
      </div>
    </>
  )
}

function ScoreCard({ label, value, grade, highlight = false }: { label: string; value: number | null; grade: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${highlight ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' : 'bg-white shadow-card'}`}>
      <p className={`text-xs font-medium mb-2 ${highlight ? 'text-blue-100' : 'text-[#8896A8]'}`}>{label}</p>
      <p className={`text-3xl font-extrabold ${highlight ? 'text-white' : 'text-[#0D1B2A]'}`}>
        {value?.toFixed(1) ?? '-'}
      </p>
      <p className={`text-xs mt-1 ${highlight ? 'text-blue-200' : 'text-[#8896A8]'}`}>등급 {grade}</p>
    </div>
  )
}

function StrengthCard({ title, items, type }: { title: string; items: { category: string; avg: number }[]; type: 'strength' | 'improve' }) {
  const colors = type === 'strength'
    ? { bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500', title: 'text-blue-700' }
    : { bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500', title: 'text-amber-700' }
  return (
    <div className={`rounded-2xl p-4 border ${colors.bg} ${colors.border}`}>
      <h4 className={`text-xs font-semibold ${colors.title} mb-3`}>{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.category} className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
            <span className="text-xs text-[#4A5568] flex-1 truncate">{item.category}</span>
            <span className="text-xs font-semibold text-[#0D1B2A]">{item.avg.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CommentsSection({ title, comments, count, minCount }: { title: string; comments: string[]; count: number; minCount: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[#0D1B2A]">{title}</h3>
        <span className="text-xs text-[#8896A8]">응답자 {count}명</span>
      </div>
      {count < minCount ? (
        <div className="flex items-center gap-2 text-sm text-[#8896A8] py-2">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          응답자 수 부족으로 비공개 (최소 {minCount}명 필요)
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[#8896A8] py-2">작성된 코멘트가 없습니다</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c, i) => (
            <div key={i} className="bg-[#F0F4FA] rounded-xl px-4 py-3 text-sm text-[#4A5568] leading-relaxed">{c}</div>
          ))}
        </div>
      )}
    </div>
  )
}
