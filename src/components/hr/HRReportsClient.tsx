'use client'

import { useState } from 'react'
import { scoreToGrade } from '@/lib/score'
import * as XLSX from 'xlsx'

interface ReportRow {
  id: string; name: string; team: string; role: string
  totalScore: number | null; downwardScore: number | null
  peerScore: number | null; upwardScore: number | null
}

export default function HRReportsClient({ rows, cycleYear }: { rows: ReportRow[]; cycleYear: number }) {
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('ALL')

  const teams = ['ALL', ...Array.from(new Set(rows.map((r) => r.team))).sort()]
  const filtered = rows.filter((r) =>
    (teamFilter === 'ALL' || r.team === teamFilter) &&
    (r.name.includes(search) || r.team.includes(search))
  )

  function downloadExcel() {
    const data = [
      ['이름', '팀', '역할', '종합', '등급', '팀장평가', '동료평가', '상향평가'],
      ...filtered.map((r) => [
        r.name, r.team, r.role,
        r.totalScore?.toFixed(1) ?? '-',
        scoreToGrade(r.totalScore),
        r.downwardScore?.toFixed(1) ?? '-',
        r.peerScore?.toFixed(1) ?? '-',
        r.upwardScore?.toFixed(1) ?? '-',
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${cycleYear}년 다면평가`)
    XLSX.writeFile(wb, `EverEx_${cycleYear}_다면평가결과.xlsx`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8896A8]" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름/팀 검색"
            className="h-9 pl-8 pr-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-blue-400 w-44" />
        </div>
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}
          className="h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400">
          {teams.map((t) => <option key={t} value={t}>{t === 'ALL' ? '전체 팀' : t}</option>)}
        </select>
        <button onClick={downloadExcel}
          className="ml-auto flex items-center gap-1.5 text-sm font-medium text-[#4A5568] border border-[#DDE3EE] px-3 py-2 rounded-xl hover:bg-gray-50">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Excel 다운로드
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#F0F4FA]">
              {['이름', '팀', '종합', '등급', '팀장', '동료', '상향'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#4A5568]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const grade = scoreToGrade(row.totalScore)
              return (
                <tr key={row.id} className="border-t border-[#DDE3EE] hover:bg-[#F8FAFD]">
                  <td className="px-4 py-3 font-medium text-[#0D1B2A]">{row.name}</td>
                  <td className="px-4 py-3 text-[#8896A8] text-xs">{row.team}</td>
                  <td className="px-4 py-3 font-bold text-[#0D1B2A]">{row.totalScore?.toFixed(1) ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      grade === 'S' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      grade === 'A' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      grade === 'B' ? 'bg-green-50 text-green-700 border-green-200' :
                      grade === 'C' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>{grade}</span>
                  </td>
                  <td className="px-4 py-3 text-[#4A5568]">{row.downwardScore?.toFixed(1) ?? '-'}</td>
                  <td className="px-4 py-3 text-[#4A5568]">{row.peerScore?.toFixed(1) ?? '-'}</td>
                  <td className="px-4 py-3 text-[#4A5568]">{row.upwardScore?.toFixed(1) ?? '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
