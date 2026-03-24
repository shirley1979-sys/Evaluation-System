import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Question, QuestionType } from '@/types'
import { MOCK_QUESTIONS } from '@/lib/mock'

interface QuestionsState {
  questions: Question[]
  addQuestion: (q: Omit<Question, 'id'>) => void
  updateQuestion: (id: string, updates: Partial<Omit<Question, 'id'>>) => void
  deleteQuestion: (id: string) => void
  toggleActive: (id: string) => void
  resetToMock: () => void
}

export const useQuestionsStore = create<QuestionsState>()(
  persist(
    (set) => ({
      questions: MOCK_QUESTIONS,

      addQuestion: (q) =>
        set((state) => ({
          questions: [...state.questions, { ...q, id: `q_${Date.now()}` }],
        })),

      updateQuestion: (id, updates) =>
        set((state) => ({
          questions: state.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
        })),

      deleteQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
        })),

      toggleActive: (id) =>
        set((state) => ({
          questions: state.questions.map((q) => (q.id === id ? { ...q, isActive: !q.isActive } : q)),
        })),

      resetToMock: () => set({ questions: MOCK_QUESTIONS }),
    }),
    { name: 'everex-questions' }
  )
)

export const TYPE_LABEL: Record<QuestionType | 'ALL', string> = {
  ALL: '전체', COMMON: '공통', DOWNWARD: '하향', UPWARD: '상향', PEER: '동료', SELF: '셀프', TEXT: '주관식',
}

export const TYPE_COLOR: Record<QuestionType, string> = {
  COMMON:   'bg-mint-50 text-mint-700',
  DOWNWARD: 'bg-purple-50 text-purple-700',
  UPWARD:   'bg-green-50 text-green-700',
  PEER:     'bg-orange-50 text-orange-700',
  SELF:     'bg-gray-100 text-gray-600',
  TEXT:     'bg-blue-50 text-blue-700',
}
