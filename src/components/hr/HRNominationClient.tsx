'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Nominee {
  id: string
  nomineeId: string
  groupType: 'TEAMMATE' | 'COLLAB'
  status: string
  nominee: { id: string; name: string; jobTitle: string | null; team: { name: string } | null }
}

interface Group {
  nominator: { id: string; name: string; team: { name: string } | null }
  nominees: Nominee[]
}

export default function HRNominationClient({ grouped, cycleId }: { grouped: Group[]; cycleId: string }) {
  const [confirming, setConfirming] = useState<string | null>(null)

  const confirmMutation = useMutation({
    mutationFn: ({ nominatorId }: { nominatorId: string }) =>
      fetch('/api/nominations/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId, nominatorId }),
      }).then((r) => r.json()),
    onSuccess: () => setConfirming(null),
  })

  const allConfirmMutation = useMutation({
    mutationFn: () =>
      fetch('/api/nominations/confirm-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId }),
      }).then((r) => r.json()),
  })

  const confirmedCount = grouped.filter((g) => g.nominees.every((n) => n.status === 'CONFIRMED')).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8896A8]">확정 완료: <strong className="text-[#0D1B2A]">{confirmedCount}/{grouped.length}</strong>명</p>
        <button
          onClick={() => { if (confirm('전체 추천을 일괄 확정하시겠습니까?')) allConfirmMutation.mutate() }}
          disabled={allConfirmMutation.isPending}
          className="text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-40"
        >
          전체 일괄 확정
        </button>
      </div>

      {grouped.map((group) => {
        const isAllConfirmed = group.nominees.every((n) => n.status === 'CONFIRMED')
        return (
          <div key={group.nominator.id} className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-[#0D1B2A]">{group.nominator.name}</p>
                <p className="text-xs text-[#8896A8]">{group.nominator.team?.name}</p>
              </div>
              {isAllConfirmed ? (
                <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">확정 완료</span>
              ) : (
                <button
                  onClick={() => confirmMutation.mutate({ nominatorId: group.nominator.id })}
                  disabled={confirmMutation.isPending}
                  className="text-xs font-semibold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                >
                  확정
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.nominees.map((nom) => (
                <span key={nom.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
                  nom.status === 'CONFIRMED'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : nom.groupType === 'TEAMMATE'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-purple-50 border-purple-200 text-purple-700'
                }`}>
                  {nom.nominee.name}
                  <span className="opacity-60">{nom.groupType === 'TEAMMATE' ? '팀원' : '협업'}</span>
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
