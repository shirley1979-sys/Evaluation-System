'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { MOCK_IDP } from '@/lib/mock'
import type { IdpGoalStatus } from '@/types'

const STATUS_LABEL: Record<IdpGoalStatus, string> = {
  NOT_STARTED: '미시작', IN_PROGRESS: '진행 중', COMPLETED: '완료',
}
const STATUS_COLOR: Record<IdpGoalStatus, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-600 border border-blue-200',
  COMPLETED:   'bg-green-50 text-green-600 border border-green-200',
}

const schema = z.object({
  strengths:    z.string().min(1, '강점을 입력하세요'),
  improvements: z.string().min(1, '개선점을 입력하세요'),
  goals: z.array(z.object({
    skill:   z.string().min(1),
    action:  z.string().min(1),
    dueDate: z.string().min(1),
    status:  z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  })),
})
type IdpForm = z.infer<typeof schema>

export default function IdpPage() {
  const user = useAuthStore((s) => s.user)
  const [saved, setSaved] = useState(false)

  if (!user) return null
  const idp = MOCK_IDP

  const { register, control, handleSubmit, formState: { errors } } = useForm<IdpForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      strengths:    idp.strengths,
      improvements: idp.improvements,
      goals: idp.goals.map((g) => ({
        skill: g.skill, action: g.action, dueDate: g.dueDate, status: g.status,
      })),
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'goals' })

  function onSubmit() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
      <Topbar title="IDP" subtitle="개인 개발 계획" />
      <div className="flex-1 overflow-y-auto p-7">
        {saved && (
          <div className="max-w-2xl mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3.5 text-sm text-green-700">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12"/></svg>
            저장되었습니다
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
          {/* 강점 / 개선점 */}
          <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
            <h3 className="font-semibold text-[#0D1B2A]">강점 & 개선 영역</h3>
            <div>
              <label className="block text-sm font-medium text-[#0D1B2A] mb-1.5">강점</label>
              <textarea {...register('strengths')} rows={2}
                className="w-full px-4 py-3 border border-[#DDE3EE] rounded-xl text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1B2A] mb-1.5">개발이 필요한 역량</label>
              <textarea {...register('improvements')} rows={2}
                className="w-full px-4 py-3 border border-[#DDE3EE] rounded-xl text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* 개발 목표 */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#0D1B2A]">개발 목표</h3>
              <button type="button"
                onClick={() => append({ skill: '', action: '', dueDate: '', status: 'NOT_STARTED' })}
                className="text-xs text-blue-600 hover:underline">+ 목표 추가</button>
            </div>
            <div className="space-y-4">
              {fields.map((field, idx) => (
                <div key={field.id} className="border border-[#DDE3EE] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#8896A8]">목표 {idx + 1}</span>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(idx)} className="text-xs text-red-400 hover:underline">삭제</button>
                    )}
                  </div>
                  <input {...register(`goals.${idx}.skill`)} placeholder="개발 역량 (예: 시스템 설계)"
                    className="w-full h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                  <input {...register(`goals.${idx}.action`)} placeholder="구체적인 액션 플랜"
                    className="w-full h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                  <div className="flex gap-3">
                    <input {...register(`goals.${idx}.dueDate`)} type="date"
                      className="flex-1 h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                    <select {...register(`goals.${idx}.status`)}
                      className="flex-1 h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400">
                      {(Object.entries(STATUS_LABEL) as [IdpGoalStatus, string][]).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 진행 현황 요약 */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-semibold text-[#0D1B2A] mb-3">진행 현황</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as IdpGoalStatus[]).map((s) => {
                const cnt = idp.goals.filter((g) => g.status === s).length
                return (
                  <div key={s} className={`rounded-xl p-3 text-center ${STATUS_COLOR[s]}`}>
                    <p className="text-2xl font-bold">{cnt}</p>
                    <p className="text-xs mt-0.5">{STATUS_LABEL[s]}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <button type="submit"
            className="w-full h-11 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors">
            IDP 저장
          </button>
        </form>
      </div>
    </>
  )
}
