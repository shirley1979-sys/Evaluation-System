import { getSession, isHROrAdmin } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import CalibrationClient from '@/components/hr/CalibrationClient'

export default async function CalibrationPage() {
  const session = await getSession()
  if (!session || !isHROrAdmin(session.user.role)) redirect('/dashboard')

  const cycle = await prisma.evalCycle.findFirst({ orderBy: { year: 'desc' } })
  if (!cycle) return (
    <>
      <Topbar title="점수 캘리브레이션" />
      <div className="flex-1 flex items-center justify-center text-[#8896A8]">사이클이 없습니다</div>
    </>
  )

  const scores = await prisma.score.findMany({
    where: { cycleId: cycle.id },
    include: { user: { include: { team: true } } },
    orderBy: { totalScore: 'desc' },
  })

  return (
    <>
      <Topbar title="점수 캘리브레이션" subtitle={`${scores.length}명`} />
      <div className="flex-1 overflow-y-auto p-7">
        <CalibrationClient scores={scores.map((s) => ({
          id: s.id,
          userId: s.userId,
          name: s.user.name,
          team: s.user.team?.name ?? '-',
          totalScore: s.totalScore,
          calibratedScore: s.calibratedScore,
          isCalibrated: s.isCalibrated,
        }))} />
      </div>
    </>
  )
}
