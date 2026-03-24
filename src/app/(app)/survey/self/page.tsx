'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { MOCK_QUESTIONS, MOCK_SURVEYS } from '@/lib/mock'

const selfSchema = z.object({
  strengths:    z.string().min(10, '최소 10자 이상 입력하세요'),
  improvements: z.string().min(10, '최소 10자 이상 입력하세요'),
  projects: z.array(z.object({
    name:        z.string().min(1, '프로젝트명을 입력하세요'),
    role:        z.string().min(1, '역할을 입력하세요'),
    deliverable: z.string().min(1, '산출물을 입력하세요'),
    impact:      z.string().min(1, '임팩트를 입력하세요'),
  })).min(1),
})
type SelfForm = z.infer<typeof selfSchema>

export default function SelfSurveyPage() {
  const user = useAuthStore((s) => s.user)

  // 기존 셀프 평가 데이터 (훅 이전에 계산)
  const selfSurvey = MOCK_SURVEYS.find((s) => s.surveyorId === user?.id && s.type === 'SELF')

  // 기존 답변으로 scores 초기화
  const [scores, setScores] = useState<Record<string, number>>(
    () => Object.fromEntries((selfSurvey?.answers ?? []).map((a) => [a.questionId, a.score]))
  )
  const [submitted, setSubmitted] = useState(false)

  // useForm은 조건부 return 이전에 호출해야 함 (훅 규칙)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SelfForm>({
    resolver: zodResolver(selfSchema),
    defaultValues: {
      strengths: '',
      improvements: '',
      projects: [{ name: '', role: '', deliverable: '', impact: '' }],
    },
  })
  const projects = watch('projects')

  if (!user) return null

  const isAlreadySubmitted = selfSurvey?.status === 'SUBMITTED' || submitted
  const questions = MOCK_QUESTIONS.filter((q) => q.type === 'COMMON' || q.type === 'SELF')

  function onSubmit(_data: SelfForm) { setSubmitted(true) }

  return (
    <>
      <Topbar title="셀프 평가" />
      <div className="flex-1 overflow-y-auto p-7">
        {isAlreadySubmitted && (
          <div className="max-w-2xl mb-5 flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            셀프 평가가 제출되었습니다.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
          {/* 역량 척도 */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-semibold text-[#0D1B2A] mb-4">역량 자기평가</h3>
            <div className="space-y-5">
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="text-sm font-medium text-[#0D1B2A] mb-2.5">{q.text}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button key={v} type="button"
                        onClick={() => !isAlreadySubmitted && setScores((p) => ({ ...p, [q.id]: v }))}
                        disabled={isAlreadySubmitted}
                        className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-all ${
                          scores[q.id] === v ? 'bg-mint-500 border-mint-500 text-white' : 'border-[#DDE3EE] text-[#4A5568] hover:border-mint-300 hover:bg-mint-50 disabled:cursor-default'
                        }`}>{v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 자기 서술 */}
          <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
            <h3 className="font-semibold text-[#0D1B2A]">자기 서술</h3>
            <div>
              <label className="block text-sm font-medium text-[#0D1B2A] mb-1.5">강점</label>
              <textarea {...register('strengths')} disabled={isAlreadySubmitted} rows={3}
                placeholder="본인의 주요 강점을 서술하세요"
                className="w-full px-4 py-3 border border-[#DDE3EE] rounded-xl text-sm resize-none focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100 disabled:bg-gray-50"
              />
              {errors.strengths && <p className="text-red-500 text-xs mt-1">{errors.strengths.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1B2A] mb-1.5">개선이 필요한 점</label>
              <textarea {...register('improvements')} disabled={isAlreadySubmitted} rows={3}
                placeholder="개선하고 싶은 부분을 서술하세요"
                className="w-full px-4 py-3 border border-[#DDE3EE] rounded-xl text-sm resize-none focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100 disabled:bg-gray-50"
              />
              {errors.improvements && <p className="text-red-500 text-xs mt-1">{errors.improvements.message}</p>}
            </div>
          </div>

          {/* 프로젝트 */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#0D1B2A]">주요 프로젝트</h3>
              {!isAlreadySubmitted && (
                <button type="button"
                  onClick={() => setValue('projects', [...projects, { name: '', role: '', deliverable: '', impact: '' }])}
                  className="text-xs text-blue-600 hover:underline">+ 추가</button>
              )}
            </div>
            <div className="space-y-4">
              {projects.map((_, idx) => (
                <div key={idx} className="border border-[#DDE3EE] rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#8896A8]">프로젝트 {idx + 1}</span>
                    {!isAlreadySubmitted && projects.length > 1 && (
                      <button type="button" onClick={() => setValue('projects', projects.filter((_, i) => i !== idx))} className="text-xs text-red-400 hover:underline">삭제</button>
                    )}
                  </div>
                  {(['name', 'role', 'deliverable', 'impact'] as const).map((field) => (
                    <input key={field} {...register(`projects.${idx}.${field}`)} disabled={isAlreadySubmitted}
                      placeholder={{ name: '프로젝트명', role: '담당 역할', deliverable: '주요 산출물', impact: '임팩트/성과' }[field]}
                      className="w-full h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-mint-400 disabled:bg-gray-50"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {!isAlreadySubmitted && (
            <button type="submit"
              className="w-full h-11 bg-mint-500 text-white font-semibold text-sm rounded-xl hover:bg-mint-600 transition-colors">
              최종 제출
            </button>
          )}
        </form>
      </div>
    </>
  )
}
