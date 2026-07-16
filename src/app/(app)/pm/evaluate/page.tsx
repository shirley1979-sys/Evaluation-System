'use client'

import { useAuthStore } from '@/store/auth'
import { useEmployeeStore } from '@/store/employees'
import { useManagerReviewStore } from '@/store/managerReview'
import { usePmAssignmentStore } from '@/store/pmAssignment'
import Topbar from '@/components/layout/Topbar'
import MemberReviewPanel from '@/components/review/MemberReviewPanel'

export default function PmEvaluatePage() {
  const user = useAuthStore((s) => s.user)
  const employees = useEmployeeStore((s) => s.employees)
  const { getReview, saveReview, submitReview } = useManagerReviewStore()
  const assignments = usePmAssignmentStore((s) => s.assignments)

  if (!user) return null

  const myAssignments = assignments.filter((a) => a.pmId === user.id)
  const developerIds = [...new Set(myAssignments.map((a) => a.developerId))]
  const developers = developerIds
    .map((id) => employees.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => !!e)

  return (
    <>
      <Topbar title="담당 개발자 평가" subtitle={`PM으로 지정된 ${developers.length}명`} />
      <div className="flex-1 overflow-y-auto p-7 space-y-5 max-w-5xl">
        {/* 담당 프로젝트 안내 */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-[#192628] mb-3">담당 프로젝트</h3>
          {myAssignments.length === 0 ? (
            <p className="text-sm text-[#8896A8]">아직 PM으로 지정된 프로젝트가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {myAssignments.map((a) => {
                const dev = employees.find((e) => e.id === a.developerId)
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFD]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {dev?.name.slice(0, 2) ?? '??'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0D1B2A]">{dev?.name ?? '알 수 없음'} <span className="text-[#8896A8] font-normal">— {a.projectName}</span></p>
                      <p className="text-xs text-[#8896A8]">{dev?.jobDuty ?? dev?.jobTitle} · {dev?.team?.name}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 평가 작성 */}
        <MemberReviewPanel
          reviewerId={user.id}
          members={developers}
          getReview={getReview}
          saveReview={saveReview}
          submitReview={submitReview}
        />
      </div>
    </>
  )
}
