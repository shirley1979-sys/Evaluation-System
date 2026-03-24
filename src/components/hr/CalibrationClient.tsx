'use client'

import { useState } from 'react'
import { useCalibrationStore } from '@/store/calibration'
import { scoreToGrade } from '@/lib/score'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface ScoreRow {
  id: string
  userId: string
  name: string
  team: string
  totalScore: number | null
  calibratedScore: number | null
  isCalibrated: boolean
}

const GRADE_COLORS: Record<string, string> = {
  S: '#F59E0B', A: '#07BEB8', B: '#10B981', C: '#F97316', D: '#EF4444', '-': '#94A3B8',
}

export default function CalibrationClient({ scores }: { scores: ScoreRow[] }) {
  const { overrides, setCalibrated, confirmAll, resetAll, confirmedAt } = useCalibrationStore()
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [justSaved, setJustSaved] = useState(false)

  // 스토어 override 병합
  const merged = scores.map((s) => ({
    ...s,
    calibratedScore: overrides[s.userId] ?? s.calibratedScore,
    isCalibrated: s.userId in overrides || s.isCalibrated,
  }))

  function handleSave() {
    const toSave = Object.entries(edits).filter(([, v]) => v !== '' && !isNaN(parseFloat(v)))
    toSave.forEach(([scoreId, val]) => {
      const row = merged.find((s) => s.id === scoreId)
      if (row) setCalibrated(row.userId, parseFloat(parseFloat(val).toFixed(2)))
    })
    setEdits({})
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 3000)
  }

  // 등급 분포 데이터
  const gradeData = ['S', 'A', 'B', 'C', 'D'].map((g) => ({
    grade: g,
    count: merged.filter((s) => scoreToGrade(s.calibratedScore ?? s.totalScore) === g).length,
  }))

  const calibratedCount = merged.filter((s) => s.isCalibrated).length
  const pct = scores.length > 0 ? Math.round((calibratedCount / scores.length) * 100) : 0

  return (
    <div className="space-y-5 max-w-5xl">

      {/* 요약 카드 2개 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-[#192628] mb-4">등급 분포</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={gradeData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
              <XAxis dataKey="grade" tick={{ fontSize: 12, fill: '#4A5568' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8896A8' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #DDE3EE', fontSize: 12 }}
                formatter={(val) => [`${val}명`, '인원']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {gradeData.map((entry) => (
                  <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-[#192628] mb-4">캘리브레이션 현황</h3>
          <div className="space-y-3">
            {[
              { label: '전체 대상',  value: `${scores.length}명`,        color: 'text-[#192628]' },
              { label: '조정 완료',  value: `${calibratedCount}명`,      color: 'text-mint-600' },
              { label: '미조정',     value: `${scores.length - calibratedCount}명`, color: 'text-amber-500' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-sm text-[#4A5568]">{row.label}</span>
                <span className={`font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-mint-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            {confirmedAt && (
              <p className="text-[11px] text-green-600">✓ {new Date(confirmedAt).toLocaleString('ko-KR')} 최종 확정</p>
            )}
          </div>
        </div>
      </div>

      {/* 점수 테이블 */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#192628]">개인별 점수 조정</h3>
          <div className="flex items-center gap-2">
            {calibratedCount > 0 && (
              <button
                onClick={() => { if (window.confirm('모든 조정을 초기화하겠습니까?')) resetAll() }}
                className="text-xs text-[#8896A8] hover:text-red-500 hover:underline transition-colors"
              >초기화</button>
            )}
            {calibratedCount > 0 && !confirmedAt && (
              <button
                onClick={() => { if (window.confirm('캘리브레이션을 최종 확정하겠습니까?')) confirmAll() }}
                className="text-xs font-semibold text-mint-600 border border-mint-200 bg-mint-50 hover:bg-mint-100 px-3 py-1.5 rounded-lg transition-colors"
              >최종 확정</button>
            )}
            <button
              onClick={handleSave}
              disabled={Object.keys(edits).length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-mint-500 hover:bg-mint-600 disabled:opacity-40 px-4 py-1.5 rounded-lg transition-colors"
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {Object.keys(edits).length > 0 ? `${Object.keys(edits).length}건 저장` : '저장'}
            </button>
          </div>
        </div>

        {justSaved && (
          <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12"/></svg>
            캘리브레이션 점수가 저장되었습니다
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F0F4FA]">
                {['순위', '이름', '팀', '원점수', '현재 등급', '조정 점수', '조정 등급'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[#4A5568]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {merged.map((row, idx) => {
                const baseScore  = row.calibratedScore ?? row.totalScore
                const editVal    = edits[row.id]
                const editScore  = editVal !== undefined && editVal !== '' ? parseFloat(editVal) : null
                const baseGrade  = scoreToGrade(baseScore)
                const newGrade   = editScore !== null && !isNaN(editScore) ? scoreToGrade(editScore) : null
                const isEditing  = editVal !== undefined && editVal !== ''

                return (
                  <tr key={row.id} className={`border-t border-[#DDE3EE] transition-colors ${row.isCalibrated ? 'bg-mint-50/20' : 'hover:bg-[#F8FAFD]'}`}>
                    <td className="px-4 py-3 text-xs font-bold text-[#8896A8]">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {row.name.slice(0, 2)}
                        </div>
                        <span className="font-medium text-[#192628]">{row.name}</span>
                        {row.isCalibrated && (
                          <span className="text-[9px] font-semibold text-mint-600 bg-mint-50 border border-mint-200 px-1.5 py-0.5 rounded-full">조정됨</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4A5568] text-xs">{row.team}</td>
                    <td className="px-4 py-3 font-bold text-[#0D1B2A]">{row.totalScore?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-3"><GradeBadge grade={baseGrade} /></td>
                    <td className="px-4 py-3 w-36">
                      <input
                        type="number" min="1" max="5" step="0.1"
                        value={editVal ?? (row.isCalibrated ? (row.calibratedScore?.toFixed(1) ?? '') : '')}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        placeholder={row.totalScore?.toFixed(1) ?? '1.0~5.0'}
                        className={`w-full h-8 px-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${
                          isEditing ? 'border-mint-400 ring-2 ring-mint-100 bg-mint-50/30' : 'border-[#DDE3EE] focus:border-mint-400'
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {newGrade ? <GradeBadge grade={newGrade} highlight /> : row.isCalibrated ? <GradeBadge grade={baseGrade} /> : null}
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
    A: 'bg-mint-50 text-mint-700 border-mint-200',
    B: 'bg-green-50 text-green-700 border-green-200',
    C: 'bg-orange-50 text-orange-700 border-orange-200',
    D: 'bg-red-50 text-red-700 border-red-200',
    '-': 'bg-gray-50 text-gray-500 border-gray-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[grade] ?? colors['-']} ${highlight ? 'ring-2 ring-mint-300' : ''}`}>
      {grade}
    </span>
  )
}
