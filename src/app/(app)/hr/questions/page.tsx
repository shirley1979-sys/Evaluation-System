'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { MOCK_QUESTIONS } from '@/lib/mock'
import type { Question, QuestionType } from '@/types'

const TYPE_LABEL: Record<QuestionType, string> = {
  COMMON: '공통', DOWNWARD: '하향', UPWARD: '상향', PEER: '동료', SELF: '셀프',
}

const TYPE_COLOR: Record<QuestionType, string> = {
  COMMON: 'bg-blue-50 text-blue-700',
  DOWNWARD: 'bg-purple-50 text-purple-700',
  UPWARD: 'bg-green-50 text-green-700',
  PEER: 'bg-orange-50 text-orange-700',
  SELF: 'bg-gray-100 text-gray-600',
}

export default function QuestionsPage() {
  const user = useAuthStore((s) => s.user)
  const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS)
  const [editTarget, setEditTarget] = useState<Question | null>(null)
  const [newItem, setNewItem] = useState(false)
  const [filter, setFilter] = useState<QuestionType | 'ALL'>('ALL')

  if (!user) return null

  const filtered = filter === 'ALL' ? questions : questions.filter((q) => q.type === filter)

  function toggleActive(id: string) {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, isActive: !q.isActive } : q))
  }

  function deleteQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  function saveQuestion(data: Omit<Question, 'id'>, id?: string) {
    if (id) {
      setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, ...data } : q))
    } else {
      setQuestions((prev) => [...prev, { ...data, id: `q_${Date.now()}` }])
    }
    setEditTarget(null)
    setNewItem(false)
  }

  return (
    <>
      <Topbar title="평가 문항 관리" subtitle={`총 ${questions.length}개`} />
      <div className="flex-1 overflow-y-auto p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'COMMON', 'DOWNWARD', 'UPWARD', 'PEER', 'SELF'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === t ? 'bg-blue-600 text-white' : 'bg-white border border-[#DDE3EE] text-[#4A5568] hover:bg-gray-50'
                }`}
              >
                {t === 'ALL' ? '전체' : TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setNewItem(true)}
            className="text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex-shrink-0 ml-3"
          >
            + 문항 추가
          </button>
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
                <tr key={q.id} className={`border-t border-[#DDE3EE] hover:bg-[#F8FAFD] ${!q.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-[#8896A8] text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLOR[q.type]}`}>
                      {TYPE_LABEL[q.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8896A8] text-xs">{q.category}</td>
                  <td className="px-4 py-3 font-medium text-[#0D1B2A] max-w-xs truncate">{q.text}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(q.id)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${q.isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${q.isActive ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => setEditTarget(q)} className="text-xs text-blue-500 hover:underline">수정</button>
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
        </div>

        {(editTarget || newItem) && (
          <QuestionModal
            question={editTarget}
            onClose={() => { setEditTarget(null); setNewItem(false) }}
            onSave={saveQuestion}
          />
        )}
      </div>
    </>
  )
}

function QuestionModal({
  question,
  onClose,
  onSave,
}: {
  question: Question | null
  onClose: () => void
  onSave: (data: Omit<Question, 'id'>, id?: string) => void
}) {
  const [form, setForm] = useState({
    text: question?.text ?? '',
    description: question?.description ?? '',
    type: (question?.type ?? 'COMMON') as QuestionType,
    category: question?.category ?? '',
    anchor1: question?.anchor1 ?? '',
    anchor3: question?.anchor3 ?? '',
    anchor5: question?.anchor5 ?? '',
    order: question?.order ?? 99,
    isActive: question?.isActive ?? true,
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
        <h3 className="font-semibold text-[#0D1B2A] mb-4">{question ? '문항 수정' : '문항 추가'}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#4A5568] mb-1 block">유형</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })}
                className="w-full h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400"
              >
                {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#4A5568] mb-1 block">카테고리</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#4A5568] mb-1 block">문항 내용 <span className="text-red-400">*</span></label>
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-[#DDE3EE] rounded-lg text-sm resize-none focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([1, 3, 5] as const).map((v) => (
              <div key={v}>
                <label className="text-xs font-medium text-[#4A5568] mb-1 block">{v}점 기준</label>
                <input
                  value={form[`anchor${v}` as 'anchor1' | 'anchor3' | 'anchor5']}
                  onChange={(e) => setForm({ ...form, [`anchor${v}`]: e.target.value })}
                  className="w-full h-9 px-2 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-blue-400"
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
            className="flex-1 h-10 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-40"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
