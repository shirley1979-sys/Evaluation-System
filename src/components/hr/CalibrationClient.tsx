'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { scoreToGrade } from '@/lib/score'

interface ScoreRow {
  id: string
  userId: string
  name: string
  team: string
  totalScore: number | null
  calibratedScore: number | null
  isCalibrated: boolean
}

export default function CalibrationClient({ scores }: { scores: ScoreRow[] }) {
  const [edits, setEdits] = useState<Record<string, string>>({})

  const saveMutation = useMutation({
    mutationFn: (payload: { scoreId: string; calibratedScore: number }[]) =>
      fetch('/api/scores/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: payload }),
      }).then((r) => r.json()),
  })

  function handleSave() {
    const updates = Object.entries(edits)
      .map(([scoreId, val]) => ({ scoreId, calibratedScore: parseFloat(val) }))
      .filter((u) => !isNaN(u.calibratedScore))
    if (updates.length === 0) return
    saveMutation.mutate(updates)
  }

  const gradeCount = (grade: string) =>
    scores.filter((s) => scoreToGrade(s.calibratedScore ?? s.totalScore) === grade).length

  return (
    <div className="space-y-5">
      {/* 등급 분포 */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <h3 className="font-semibold text-[#0D1B2A] mb-4">등급 분포</h3>
        <div className="flex gap-3">
          {['S', 'A', 'B', 'C', 'D'].map((g) => (
            <div key={g} className="flex-1 bg-[#F0F4FA] rounded-xl p-3 text-center">
              <p className="text-lg font-extrabold text-[#0D1B2A]">{gradeCount(g)}</p>
              <p className="text-xs text-[#8896A8] mt-0.5">등급 {g}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 점수 테이블 */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#0D1B2A]">개인별 점수 보정</h3>
          <button
            onClick={handleSave}
            disabled={Object.keys(edits).length === 0 || saveMutation.isPending}
            className="text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-40"
          >
            {saveMutation.isPending ? '저장 중...' : `${Object.keys(edits).length}건 저장`}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F0F4FA]">
                {['이름', '팀', '종합 점수', '등급', '보정 점수', '보정 등급'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[#4A5568]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scores.map((row) => {
                const displayScore = row.calibratedScore ?? row.totalScore
                const editVal = edits[row.id]
                const editScore = editVal ? parseFloat(editVal) : null
                return (
                  <tr key={row.id} className="border-t border-[#DDE3EE] hover:bg-[#F8FAFD]">
                    <td className="px-4 py-3 font-medium text-[#0D1B2A]">{row.name}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{row.team}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{row.totalScore?.toFixed(1) ?? '-'}</td>
                    <td className="px-4 py-3">
                      <GradeBadge grade={scoreToGrade(displayScore)} />
                    </td>
                    <td className="px-4 py-3 w-28">
                      <input
                        type="number"
                        min="1" max="5" step="0.1"
                        value={editVal ?? row.calibratedScore ?? ''}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        placeholder="1.0 ~ 5.0"
                        className="w-full h-8 px-2 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-blue-400"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {editScore !== null && !isNaN(editScore) && (
                        <GradeBadge grade={scoreToGrade(editScore)} highlight />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function GradeBadge({ grade, highlight = false }: { grade: string; highlight?: boolean }) {
  const colors: Record<string, string> = {
    S: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    A: 'bg-blue-50 text-blue-700 border-blue-200',
    B: 'bg-green-50 text-green-700 border-green-200',
    C: 'bg-orange-50 text-orange-700 border-orange-200',
    D: 'bg-red-50 text-red-700 border-red-200',
    '-': 'bg-gray-50 text-gray-500 border-gray-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[grade] ?? colors['-']} ${highlight ? 'ring-2 ring-blue-300' : ''}`}>
      {grade}
    </span>
  )
}
