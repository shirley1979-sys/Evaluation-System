'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { useQuestionsStore, TYPE_LABEL, TYPE_COLOR } from '@/store/questions'
import type { Question, QuestionType } from '@/types'

export default function QuestionsPage() {
  const user = useAuthStore((s) => s.user)
  const { questions, addQuestion, updateQuestion, deleteQuestion, toggleActive, resetToMock } = useQuestionsStore()
  const [editTarget, setEditTarget] = useState<Question | null>(null)
  const [showNew, setShowNew]       = useState(false)
  const [filter, setFilter]         = useState<QuestionType | 'ALL'>('ALL')

  if (!user) return null

  const filtered = filter === 'ALL' ? questions : questions.filter((q) => q.type === filter)

  return (
    <>
      <Topbar title="평가 문항 관리" subtitle={`총 ${questions.length}개`} />
      <div className="flex-1 overflow-y-auto p-7 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'COMMON', 'DOWNWARD', 'UPWARD', 'PEER', 'SELF'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === t
                    ? 'bg-mint-500 text-white'
                    : 'bg-white border border-[#DDE3EE] text-[#4A5568] hover:bg-gray-50'
                }`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { if (window.confirm('기본 문항으로 초기화하겠습니까?')) resetToMock() }}
              className="text-xs text-[#8896A8] hover:text-red-500 hover:underline transition-colors"
            >초기화</button>
            <button
              onClick={() => setShowNew(true)}
              className="text-sm font-semibold text-white bg-mint-500 px-4 py-2 rounded-xl hover:bg-mint-600 flex-shrink-0"
            >+ 문항 추가</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F0F4FA]">
                {['#', '유형', '카테고리', '문항', '활성', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#4A5568]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, idx) => (
                <tr key={q.id} className={`border-t border-[#DDE3EE] transition-colors ${!q.isActive ? 'opacity-40' : 'hover:bg-[#F8FAFD]'}`}>
                  <td className="px-4 py-3 text-[#8896A8] text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[q.type]}`}>
                      {TYPE_LABEL[q.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8896A8] text-xs">{q.category}</td>
                  <td className="px-4 py-3 text-[#0D1B2A] max-w-xs truncate">{q.text}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(q.id)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${q.isActive ? 'bg-mint-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${q.isActive ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => setEditTarget(q)} className="text-xs text-mint-600 hover:underline">수정</button>
                      <button
                        onClick={() => { if (window.confirm('삭제하시겠습니까?')) deleteQuestion(q.id) }}
                        className="text-xs text-red-400 hover:underline"
                      >삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-[#8896A8]">해당 유형의 문항이 없습니다</p>
            </div>
          )}
        </div>

        {(editTarget || showNew) && (
          <QuestionModal
            question={editTarget}
            onClose={() => { setEditTarget(null); setShowNew(false) }}
            onSave={(data, id) => {
              if (id) updateQuestion(id, data); else addQuestion(data)
              setEditTarget(null); setShowNew(false)
            }}
          />
        )}
      </div>
    </>
  )
}

function QuestionModal({
  question, onClose, onSave,
}: {
  question: Question | null
  onClose: () => void
  onSave: (data: Omit<Question, 'id'>, id?: string) => void
}) {
  const [form, setForm] = useState({
    text:        question?.text ?? '',
    description: question?.description ?? null,
    type:        (question?.type ?? 'COMMON') as QuestionType,
    category:    question?.category ?? '',
    anchor1:     question?.anchor1 ?? null,
    anchor3:     question?.anchor3 ?? null,
    anchor5:     question?.anchor5 ?? null,
    order:       question?.order ?? 99,
    isActive:    question?.isActive ?? true,
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-[#0D1B2A] mb-5">{question ? '문항 수정' : '문항 추가'}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#4A5568] mb-1.5 block">유형</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })}
                className="w-full h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm bg-white focus:outline-none focus:border-mint-400">
                {Object.entries(TYPE_LABEL).filter(([k]) => k !== 'ALL').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#4A5568] mb-1.5 block">카테고리</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="예: 리더십, 업무 성과"
                className="w-full h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-mint-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#4A5568] mb-1.5 block">문항 내용 <span className="text-red-400">*</span></label>
            <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={2}
              className="w-full px-3 py-2.5 border border-[#DDE3EE] rounded-lg text-sm resize-none focus:outline-none focus:border-mint-400" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([1, 3, 5] as const).map((v) => (
              <div key={v}>
                <label className="text-xs font-medium text-[#4A5568] mb-1.5 block">{v}점 기준</label>
                <input
                  value={form[`anchor${v}` as 'anchor1' | 'anchor3' | 'anchor5'] ?? ''}
                  onChange={(e) => setForm({ ...form, [`anchor${v}`]: e.target.value || null })}
                  className="w-full h-8 px-2 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-mint-400"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 h-10 border border-[#DDE3EE] text-sm font-medium text-[#4A5568] rounded-xl hover:bg-gray-50">취소</button>
          <button
            onClick={() => { if (form.text.trim()) onSave(form, question?.id) }}
            disabled={!form.text.trim()}
            className="flex-1 h-10 bg-mint-500 text-white font-semibold text-sm rounded-xl hover:bg-mint-600 disabled:opacity-40"
          >저장</button>
        </div>
      </div>
    </div>
  )
}
