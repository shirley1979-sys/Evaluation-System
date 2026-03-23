'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { MOCK_QUESTIONS, MOCK_SURVEYS, MOCK_USERS } from '@/lib/mock'

export default function UpwardSurveyPage() {
  const user = useAuthStore((s) => s.user)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!user) return null

  const upwardSurvey = MOCK_SURVEYS.find((s) => s.surveyorId === user.id && s.type === 'UPWARD')
  const manager = upwardSurvey ? MOCK_USERS.find((u) => u.id === upwardSurvey.targetId) : null
  const questions = MOCK_QUESTIONS.filter((q) => q.type === 'COMMON' || q.type === 'UPWARD')
  const isAlreadySubmitted = upwardSurvey?.status === 'SUBMITTED' || submitted
  const allAnswered = questions.every((q) => scores[q.id] !== undefined)

  if (!upwardSurvey || !manager) {
    return (
      <>
        <Topbar title="상향 평가" />
        <div className="flex-1 flex items-center justify-center text-[#8896A8]">배정된 상향 평가가 없습니다</div>
      </>
    )
  }

  return (
    <>
      <Topbar title="상향 평가" />
      <div className="flex-1 overflow-y-auto p-7">
        <div className="max-w-2xl space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2.5">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            상향 평가는 완전히 익명으로 처리됩니다. 응답자가 3명 이상일 때 팀장에게 공개됩니다.
          </div>

          <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              {manager.name.slice(0, 2)}
            </div>
            <div>
              <h2 className="font-semibold text-[#0D1B2A]">{manager.name}</h2>
              <p className="text-xs text-[#8896A8]">{manager.jobTitle} · {manager.team?.name}</p>
            </div>
            {isAlreadySubmitted && <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">제출 완료</span>}
          </div>

          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl shadow-card p-5">
              <p className="text-[10px] font-semibold text-[#8896A8] uppercase tracking-wider mb-1.5">{q.category}</p>
              <p className="text-sm font-medium text-[#0D1B2A] mb-3">{q.text}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} onClick={() => !isAlreadySubmitted && setScores((p) => ({ ...p, [q.id]: v }))}
                    disabled={isAlreadySubmitted}
                    className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-all ${
                      scores[q.id] === v ? 'bg-blue-600 border-blue-600 text-white' : 'border-[#DDE3EE] text-[#4A5568] hover:border-blue-300 hover:bg-blue-50 disabled:cursor-default'
                    }`}>{v}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-2xl shadow-card p-5">
            <label className="block text-sm font-medium text-[#0D1B2A] mb-2">코멘트 <span className="text-[#8896A8] font-normal">(선택 · 익명)</span></label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} disabled={isAlreadySubmitted} rows={3}
              placeholder="팀장에게 전달하고 싶은 피드백을 자유롭게 작성하세요"
              className="w-full px-4 py-3 border border-[#DDE3EE] rounded-xl text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
            />
          </div>

          {!isAlreadySubmitted && (
            <button onClick={() => setSubmitted(true)} disabled={!allAnswered}
              className="w-full h-11 bg-blue-600 text-white font-semibold text-sm rounded-xl disabled:opacity-40 hover:bg-blue-700 transition-colors">
              최종 제출
            </button>
          )}
        </div>
      </div>
    </>
  )
}
