'use client'

import { MOCK_SCORES } from '@/lib/mock'
import Topbar from '@/components/layout/Topbar'
import CalibrationClient from '@/components/hr/CalibrationClient'

export default function CalibrationPage() {
  const scores = [...MOCK_SCORES]
    .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
    .map((s) => ({
      id: s.id,
      userId: s.userId,
      name: s.user?.name ?? '-',
      team: s.user?.team?.name ?? '-',
      totalScore: s.totalScore,
      calibratedScore: s.calibratedScore,
      isCalibrated: s.isCalibrated,
    }))

  return (
    <>
      <Topbar title="점수 캘리브레이션" subtitle={`${scores.length}명`} />
      <div className="flex-1 overflow-y-auto p-7">
        <CalibrationClient scores={scores} />
      </div>
    </>
  )
}
