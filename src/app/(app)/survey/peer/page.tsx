'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useNominationStore } from '@/store/nominations'
import { useEmployeeStore } from '@/store/employees'
import Topbar from '@/components/layout/Topbar'
import { MOCK_QUESTIONS, getSurveysForSurveyor } from '@/lib/mock'
import { useSurveyDraftStore } from '@/store'
import type { Survey } from '@/types'

export default function PeerSurveyPage() {
  const user = useAuthStore((s) => s.user)
  const { setDraft, getDraft, clearDraft } = useSurveyDraftStore()
  const allNomEntries = useNominationStore((s) => s.entries)
  const allEmployees = useEmployeeStore((s) => s.employees)
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set())
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null)

  if (!user) return null

  const staticSurveys = getSurveysForSurveyor(user.id).filter((s) => s.type !== 'UPWARD')

  // 내가 동료로 지정되어(승인 완료) 평가해야 할 대상 = 확정된 추천에서 내가 승인한 nominee인 항목의 nominatorId
  const targetIdsToEvaluate = allNomEntries
    .filter((e) => e.status === 'CONFIRMED')
    .filter((e) => e.nominees.some((n) => n.userId === user.id && n.approval === 'APPROVED'))
    .map((e) => e.nominatorId)
  const derivedSurveys: Survey[] = targetIdsToEvaluate
    .filter((id) => !staticSurveys.some((s) => s.targetId === id))
    .map((id) => {
      const target = allEmployees.find((e) => e.id === id)
      return {
        id: `nom-${user.id}-${id}`, cycleId: 'cycle2026', surveyorId: user.id, targetId: id, type: 'PEER',
        status: 'DRAFT', submittedAt: null, comment: '', answers: [],
        target, surveyor: allEmployees.find((e) => e.id === user.id),
      } as Survey
    })

  const surveys = [...staticSurveys, ...derivedSurveys]
  const peerQuestions = MOCK_QUESTIONS.filter((q) => q.type === 'COMMON' || q.type === 'PEER')

  const activeSurveyId = activeTargetId ?? surveys[0]?.id
  const activeSurvey = surveys.find((s) => s.id === activeSurveyId) ?? surveys[0]

  const completed = surveys.filter((s) => s.status === 'SUBMITTED' || submittedIds.has(s.id)).length

  return (
    <>
      <Topbar title="동료 평가" subtitle={`${completed}/${surveys.length} 완료`} />
      <div className="flex-1 overflow-hidden flex">
        {/* 대상 목록 */}
        <aside className="w-56 flex-shrink-0 bg-white border-r border-[#DDE3EE] overflow-y-auto p-3">
          <p className="text-[10px] font-semibold text-[#8896A8] uppercase tracking-wider px-2 py-2 mb-1">평가 대상</p>
          {surveys.map((s) => {
            const isDone = s.status === 'SUBMITTED' || submittedIds.has(s.id)
            return (
              <button key={s.id} onClick={() => setActiveTargetId(s.id)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl mb-1 text-left transition-all ${
                  activeSurvey?.id === s.id ? 'bg-mint-50 border border-mint-200' : 'hover:bg-gray-50 border border-transparent'
                }`}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {s.target?.name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#0D1B2A] truncate">{s.target?.name}</p>
                  <p className="text-[10px] text-[#8896A8]">{isDone ? '완료' : '미완료'}</p>
                </div>
                {isDone && (
                  <svg className="text-green-500 flex-shrink-0" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            )
          })}
        </aside>

        {/* 평가 폼 */}
        <div className="flex-1 overflow-y-auto p-7">
          {activeSurvey ? (
            <SurveyForm
              key={activeSurvey.id}
              survey={activeSurvey}
              questions={peerQuestions}
              initiallySubmitted={activeSurvey.status === 'SUBMITTED' || submittedIds.has(activeSurvey.id)}
              initialAnswers={activeSurvey.answers}
              initialComment={activeSurvey.comment}
              savedDraft={getDraft(activeSurvey.id)}
              onSave={(scores, comment) => setDraft(activeSurvey.id, scores, comment)}
              onSubmit={() => {
                clearDraft(activeSurvey.id)
                setSubmittedIds((prev) => new Set(prev).add(activeSurvey.id))
              }}
            />
          ) : (
            <p className="text-center text-[#8896A8] mt-20">배정된 동료 평가가 없습니다</p>
          )}
        </div>
      </div>
    </>
  )
}

function SurveyForm({ survey, questions, initiallySubmitted, initialAnswers, initialComment, savedDraft, onSave, onSubmit }: {
  survey: Survey
  questions: typeof MOCK_QUESTIONS
  initiallySubmitted: boolean
  initialAnswers: { questionId: string; score: number }[]
  initialComment: string
  savedDraft?: { scores: Record<string, number>; comment: string }
  onSave: (scores: Record<string, number>, comment: string) => void
  onSubmit: () => void
}) {
  // draft → 기제출 답변 → 빈값 순서로 초기화
  const initScores = savedDraft?.scores ?? Object.fromEntries(initialAnswers.map((a) => [a.questionId, a.score]))
  const initComment = savedDraft?.comment ?? initialComment ?? ''

  const [scores, setScores] = useState<Record<string, number>>(initScores)
  const [comment, setComment] = useState(initComment)
  const [submitted, setSubmitted] = useState(initiallySubmitted)
  const [saved, setSaved] = useState(false)

  const allAnswered = questions.every((q) => scores[q.id] !== undefined)
  const commentFilled = comment.trim().length > 0
  const canSubmit = allAnswered && commentFilled

  function handleSave() {
    onSave(scores, comment)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleSubmit() {
    setSubmitted(true)
    onSubmit()
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          {survey.target?.name.slice(0, 2)}
        </div>
        <div>
          <h2 className="font-semibold text-[#0D1B2A]">{survey.target?.name}</h2>
          <p className="text-xs text-[#8896A8]">{survey.target?.jobTitle} · {survey.target?.team?.name}</p>
        </div>
        {submitted && <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">제출 완료</span>}
      </div>

      {saved && !submitted && (
        <div className="mb-4 flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12"/></svg>
          임시 저장되었습니다
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="bg-white rounded-2xl shadow-card p-5">
            <p className="text-[10px] font-semibold text-[#8896A8] uppercase tracking-wider mb-1.5">{q.category}</p>
            <p className="text-sm font-medium text-[#0D1B2A] mb-1 leading-relaxed">{q.text}</p>
            {q.description && <p className="text-xs text-[#8896A8] mb-3 leading-relaxed">{q.description}</p>}
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} onClick={() => !submitted && setScores((p) => ({ ...p, [q.id]: v }))}
                  disabled={submitted}
                  className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-all ${
                    scores[q.id] === v
                      ? 'bg-mint-500 border-mint-500 text-white shadow-sm'
                      : 'border-[#DDE3EE] text-[#4A5568] hover:border-mint-300 hover:bg-mint-50 disabled:cursor-default disabled:opacity-70'
                  }`}>{v}
                </button>
              ))}
            </div>
            {(q.anchor1 || q.anchor5) && (
              <div className="flex justify-between mt-2 text-[10px] text-[#8896A8]">
                <span>1 — {q.anchor1}</span>
                <span>5 — {q.anchor5}</span>
              </div>
            )}
          </div>
        ))}

        <div className="bg-white rounded-2xl shadow-card p-5">
          <label className="block text-sm font-medium text-[#0D1B2A] mb-2">코멘트 <span className="text-red-500 font-normal">(필수 · 익명)</span></label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} disabled={submitted} rows={3}
            placeholder="자유롭게 피드백을 남겨주세요. 익명으로 전달됩니다. (필수 입력)"
            className="w-full px-4 py-3 border border-[#DDE3EE] rounded-xl text-sm resize-none focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100 disabled:bg-gray-50"
          />
          {!submitted && !commentFilled && (
            <p className="text-xs text-red-500 mt-1.5">동료 평가는 서술형 코멘트 작성이 필수입니다.</p>
          )}
        </div>
      </div>

      {!submitted && (
        <div className="flex gap-3 mt-5">
          <button onClick={handleSave} className="flex-1 h-11 border border-[#DDE3EE] text-sm font-medium text-[#4A5568] rounded-xl hover:bg-gray-50 transition-colors">임시 저장</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex-1 h-11 bg-mint-500 text-white font-semibold text-sm rounded-xl disabled:opacity-40 hover:bg-mint-600 transition-colors">
            {!allAnswered ? '모든 문항에 응답하세요' : !commentFilled ? '코멘트를 입력하세요' : '최종 제출'}
          </button>
        </div>
      )}
    </div>
  )
}
