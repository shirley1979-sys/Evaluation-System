'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { MOCK_NOMINATIONS, MOCK_USERS } from '@/lib/mock'
import type { Nomination } from '@/types'

export default function HRNominationPage() {
  const user = useAuthStore((s) => s.user)
  const [nominations, setNominations] = useState<Nomination[]>(MOCK_NOMINATIONS)

  if (!user) return null

  // 추천자별 그룹핑
  const nominatorIds = [...new Set(nominations.map((n) => n.nominatorId))]
  const grouped = nominatorIds.map((nId) => ({
    nominator: MOCK_USERS.find((u) => u.id === nId)!,
    nominees: nominations.filter((n) => n.nominatorId === nId),
  }))

  function confirmAll() {
    setNominations((prev) => prev.map((n) => ({ ...n, status: 'CONFIRMED' as const })))
  }

  function confirmOne(nominatorId: string) {
    setNominations((prev) =>
      prev.map((n) => n.nominatorId === nominatorId ? { ...n, status: 'CONFIRMED' as const } : n)
    )
  }

  const confirmedCount = grouped.filter((g) => g.nominees.every((n) => n.status === 'CONFIRMED')).length

  return (
    <>
      <Topbar title="동료 확정" subtitle={`${confirmedCount}/${grouped.length}명 확정`} />
      <div className="flex-1 overflow-y-auto p-7 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#8896A8]">
            확정 완료 <strong className="text-[#0D1B2A]">{confirmedCount}</strong>/{grouped.length}명
          </p>
          <button
            onClick={() => { if (window.confirm('전체 추천을 일괄 확정하시겠습니까?')) confirmAll() }}
            className="text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            전체 일괄 확정
          </button>
        </div>

        {grouped.map(({ nominator, nominees }) => {
          const isConfirmed = nominees.every((n) => n.status === 'CONFIRMED')
          return (
            <div key={nominator.id} className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {nominator.name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0D1B2A] text-sm">{nominator.name}</p>
                    <p className="text-xs text-[#8896A8]">{nominator.team?.name}</p>
                  </div>
                </div>
                {isConfirmed ? (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">확정 완료</span>
                ) : (
                  <button onClick={() => confirmOne(nominator.id)}
                    className="text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                    확정
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {nominees.map((nom) => {
                  const nominee = MOCK_USERS.find((u) => u.id === nom.nomineeId)
                  return (
                    <span key={nom.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      nom.status === 'CONFIRMED' ? 'bg-green-50 border-green-200 text-green-700' :
                      nom.groupType === 'TEAMMATE' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-purple-50 border-purple-200 text-purple-700'
                    }`}>
                      {nominee?.name}
                      <span className="opacity-50">{nom.groupType === 'TEAMMATE' ? '팀원' : '협업'}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
