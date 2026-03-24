import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CalibrationState {
  overrides: Record<string, number>  // userId → calibrated score
  confirmedAt: string | null
  setCalibrated: (userId: string, score: number) => void
  bulkSetCalibrated: (entries: { userId: string; score: number }[]) => void
  clearCalibrated: (userId: string) => void
  confirmAll: () => void
  resetAll: () => void
}

export const useCalibrationStore = create<CalibrationState>()(
  persist(
    (set) => ({
      overrides: {},
      confirmedAt: null,

      setCalibrated: (userId, score) =>
        set((state) => ({ overrides: { ...state.overrides, [userId]: score }, confirmedAt: null })),

      bulkSetCalibrated: (entries) =>
        set((state) => ({
          overrides: entries.reduce(
            (acc, { userId, score }) => ({ ...acc, [userId]: score }),
            state.overrides
          ),
          confirmedAt: null,
        })),

      clearCalibrated: (userId) =>
        set((state) => {
          const { [userId]: _, ...rest } = state.overrides
          return { overrides: rest }
        }),

      confirmAll: () => set({ confirmedAt: new Date().toISOString() }),

      resetAll: () => set({ overrides: {}, confirmedAt: null }),
    }),
    { name: 'everex-calibration' }
  )
)
