import { getSession, isHROrAdmin } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import HRReportsClient from '@/components/hr/HRReportsClient'
import { buildPersonReport } from '@/lib/score'

export default async function HRReportsPage() {
  const session = await getSession()
  if (!session || !isHROrAdmin(session.user.role)) redirect('/dashboard')

  const cycle = await prisma.evalCycle.findFirst({ orderBy: { year: 'desc' } })
  if (!cycle) return (
    <>
      <Topbar title="전체 리포트" />
      <div className="flex-1 flex items-center justify-center text-[#8896A8]">사이클이 없습니다</div>
    </>
  )

  const employees = await prisma.user.findMany({
    where: { isActive: true },
    include: { team: true },
    orderBy: { name: 'asc' },
  })

  const scores = await prisma.score.findMany({
    where: { cycleId: cycle.id },
    include: { user: true },
  })

  const scoreMap = Object.fromEntries(scores.map((s) => [s.userId, s]))

  const rows = employees.map((emp) => {
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
      <Topbar title="전체 리포트" subtitle={`${employees.length}명`} />
      <div className="flex-1 overflow-y-auto p-7">
        <HRReportsClient rows={rows} cycleYear={cycle.year} />
      </div>
    </>
  )
}
