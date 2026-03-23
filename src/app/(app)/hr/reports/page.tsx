'use client'

import { MOCK_USERS, MOCK_SCORES, MOCK_CYCLE } from '@/lib/mock'
import Topbar from '@/components/layout/Topbar'
import HRReportsClient from '@/components/hr/HRReportsClient'

export default function HRReportsPage() {
  const scoreMap = Object.fromEntries(MOCK_SCORES.map((s) => [s.userId, s]))

  const rows = MOCK_USERS
    .filter((u) => u.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((emp) => {
      const s = scoreMap[emp.id]
      return {
        id: emp.id,
        name: emp.name,
        team: emp.team?.name ?? '-',
        role: emp.role,
        totalScore: s?.calibratedScore ?? s?.totalScore ?? null,
        downwardScore: s?.downwardScore ?? null,
        peerScore: s?.peerScore ?? null,
        upwardScore: s?.upwardScore ?? null,
      }
    })

  return (
    <>
      <Topbar title="전체 리포트" subtitle={`${rows.length}명`} />
      <div className="flex-1 overflow-y-auto p-7">
        <HRReportsClient rows={rows} cycleYear={MOCK_CYCLE.year} />
      </div>
    </>
  )
}
