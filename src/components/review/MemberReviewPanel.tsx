'use client'

import { useState } from 'react'
import { REVIEW_CATEGORIES, emptyReview, type MemberReview } from '@/store/managerReview'
import type { User } from '@/types'

// 팀장/부문장/PM 등 리뷰어가 대상자별 척도+총평을 작성하는 공용 패널
export default function MemberReviewPanel({
  reviewerId, members, getReview, saveReview, submitReview,
}: {
  reviewerId: string
  members: User[]
  getReview: (reviewerId: string, targetId: string) => MemberReview | undefined
  saveReview: (reviewerId: string, review: MemberReview) => void
  submitReview: (reviewerId: string, targetId: string) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(members[0]?.id ?? null)
  const [form, setForm] = useState<MemberReview>(() =>
    selectedId ? (getReview(reviewerId, selectedId) ?? emptyReview(selectedId)) : emptyReview('')
  )
  const [saveMsg, setSaveMsg] = useState('')

  function selectMember(id: string) {
    setSelectedId(id)
    setForm(getReview(reviewerId, id) ?? emptyReview(id))
  }

  function handleSave() {
    if (!selectedId) return
    saveReview(reviewerId, { ...form, targetId: selectedId })
    setSaveMsg('저장되었습니다')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  function handleSubmit() {
    if (!selectedId) return
    if (!window.confirm('이 대상자의 총평을 최종 제출하시겠습니까?')) return
    saveReview(reviewerId, { ...form, targetId: selectedId })
    submitReview(reviewerId, selectedId)
    setForm((prev) => ({ ...prev, submitted: true }))
  }

  const isSubmitted = form.submitted

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-10 text-center">
        <p className="text-sm text-[#8896A8]">평가할 대상이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
      {/* 대상자 목록 */}
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-card p-4">
        <p className="text-xs font-semibold text-[#8896A8] uppercase tracking-wide mb-3">대상자 선택</p>
        <div className="space-y-1">
          {members.map((m) => {
            const review = getReview(reviewerId, m.id)
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
                  {members.find((m) => m.id === selectedId)?.name} 총평
                </h3>
                <p className="text-xs text-[#8896A8] mt-0.5">
                  {members.find((m) => m.id === selectedId)?.jobTitle} · {members.find((m) => m.id === selectedId)?.team?.name}
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
                placeholder="대상자의 전반적인 역량, 성과, 성장 방향에 대해 종합적으로 작성하세요"
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
            <p className="text-sm text-[#8896A8]">왼쪽에서 대상자를 선택하세요</p>
          </div>
        )}
      </div>
    </div>
  )
}

// 3개 카테고리 점수 평균 → 등급 환산 (기존 scoreToGrade와 동일한 5단계 기준)
export function reviewToGrade(review: MemberReview | undefined): string {
  if (!review) return '-'
  const scores = [review.performanceScore, review.competencyScore, review.collaborationScore].filter(
    (v): v is number => v != null
  )
  if (scores.length === 0) return '-'
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  if (avg >= 4.5) return 'S'
  if (avg >= 3.8) return 'A'
  if (avg >= 3.0) return 'B'
  if (avg >= 2.0) return 'C'
  return 'D'
}
