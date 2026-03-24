'use client'

import { useState } from 'react'
import { scoreToGrade } from '@/lib/score'
import * as XLSX from 'xlsx'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface ReportRow {
  id: string; name: string; team: string; role: string
  totalScore: number | null; downwardScore: number | null
  peerScore: number | null; upwardScore: number | null
}

const GRADE_COLORS: Record<string, string> = {
  S: '#F59E0B', A: '#07BEB8', B: '#10B981', C: '#F97316', D: '#EF4444',
}
const GRADE_BADGE: Record<string, string> = {
  S: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  A: 'bg-mint-50 text-mint-700 border-mint-200',
  B: 'bg-green-50 text-green-700 border-green-200',
  C: 'bg-orange-50 text-orange-700 border-orange-200',
  D: 'bg-red-50 text-red-700 border-red-200',
}

type SortCol = 'total' | 'downward' | 'peer' | 'upward'

export default function HRReportsClient({ rows, cycleYear }: { rows: ReportRow[]; cycleYear: number }) {
  const [search, setSearch]         = useState('')
  const [teamFilter, setTeamFilter] = useState('ALL')
  const [sortBy, setSortBy]         = useState<SortCol>('total')
  const [sortDir, setSortDir]       = useState<'desc' | 'asc'>('desc')

  const teams = ['ALL', ...Array.from(new Set(rows.map((r) => r.team).filter((t) => t !== '-'))).sort()]

  const getVal = (r: ReportRow, col: SortCol) =>
    col === 'total' ? r.totalScore : col === 'downward' ? r.downwardScore : col === 'peer' ? r.peerScore : r.upwardScore

  const filtered = rows
    .filter((r) =>
      (teamFilter === 'ALL' || r.team === teamFilter) &&
      (r.name.includes(search) || r.team.includes(search))
    )
    .sort((a, b) => {
      const va = getVal(a, sortBy) ?? -1
      const vb = getVal(b, sortBy) ?? -1
      return sortDir === 'desc' ? vb - va : va - vb
    })

  function toggleSort(col: SortCol) {
    if (sortBy === col) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortBy(col); setSortDir('desc') }
  }

  // 등급 분포 (도넛)
  const gradeData = ['S', 'A', 'B', 'C', 'D'].map((g) => ({
    name: `${g}등급`,
    value: rows.filter((r) => scoreToGrade(r.totalScore) === g).length,
    color: GRADE_COLORS[g],
  })).filter((d) => d.value > 0)

  // 팀 평균 바 차트
  const teamAvgData = Array.from(new Set(rows.map((r) => r.team).filter((t) => t !== '-'))).map((team) => {
    const tr  = rows.filter((r) => r.team === team && r.totalScore !== null)
    const avg = tr.length > 0 ? tr.reduce((s, r) => s + (r.totalScore ?? 0), 0) / tr.length : 0
    return { team: team.split(' ')[0], avg: parseFloat(avg.toFixed(2)) }
  }).sort((a, b) => b.avg - a.avg)

  // 요약 통계
  const withScore = rows.filter((r) => r.totalScore !== null)
  const avgScore  = withScore.length > 0 ? withScore.reduce((s, r) => s + (r.totalScore ?? 0), 0) / withScore.length : 0
  const scores    = withScore.map((r) => r.totalScore ?? 0)
  const maxScore  = scores.length > 0 ? Math.max(...scores) : 0
  const minScore  = scores.length > 0 ? Math.min(...scores) : 0

  function downloadExcel() {
    const data = [
      ['순위', '이름', '팀', '역할', '종합', '등급', '팀장평가', '동료평가', '상향평가'],
      ...filtered.map((r, idx) => [
        idx + 1, r.name, r.team, r.role,
        r.totalScore?.toFixed(2) ?? '-', scoreToGrade(r.totalScore),
        r.downwardScore?.toFixed(2) ?? '-',
        r.peerScore?.toFixed(2) ?? '-',
        r.upwardScore?.toFixed(2) ?? '-',
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [6, 10, 20, 12, 8, 6, 10, 10, 10].map((wch) => ({ wch }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${cycleYear}년 다면평가`)
    XLSX.writeFile(wb, `EverEx_${cycleYear}_다면평가결과.xlsx`)
  }

  const SortArrow = ({ col }: { col: SortCol }) =>
    sortBy === col ? (
      <svg className="inline ml-0.5" width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        {sortDir === 'desc' ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
      </svg>
    ) : null

  return (
    <div className="space-y-5 max-w-5xl">
      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '평가 인원',  value: `${withScore.length}명`, sub: `전체 ${rows.length}명` },
          { label: '평균 점수',  value: avgScore.toFixed(2),     sub: `등급 ${scoreToGrade(avgScore)}` },
          { label: '최고 점수',  value: maxScore > 0 ? maxScore.toFixed(2) : '-', sub: maxScore > 0 ? `등급 ${scoreToGrade(maxScore)}` : '' },
          { label: '최저 점수',  value: minScore > 0 ? minScore.toFixed(2) : '-', sub: minScore > 0 ? `등급 ${scoreToGrade(minScore)}` : '' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-card p-4">
            <p className="text-xs text-[#8896A8] mb-1">{card.label}</p>
            <p className="text-2xl font-extrabold text-[#192628]">{card.value}</p>
            <p className="text-xs text-[#8896A8] mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* 차트 2개 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-[#192628] mb-4">등급 분포</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={gradeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {gradeData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #DDE3EE', fontSize: 12 }} formatter={(val) => [`${val}명`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 flex-wrap mt-1">
            {gradeData.map((d) => (
              <div key={d.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-[#4A5568]">{d.name} {d.value}명</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-[#192628] mb-4">팀별 평균 점수</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={teamAvgData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
              <XAxis dataKey="team" tick={{ fontSize: 10, fill: '#4A5568' }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: '#8896A8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #DDE3EE', fontSize: 12 }} formatter={(val) => [`${val}점`]} />
              <Bar dataKey="avg" fill="#07BEB8" radius={[4, 4, 0, 0]} name="평균 점수" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8896A8]" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름/팀 검색"
              className="h-9 pl-8 pr-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100 w-44" />
          </div>
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}
            className="h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm bg-white focus:outline-none focus:border-mint-400">
            {teams.map((t) => <option key={t} value={t}>{t === 'ALL' ? '전체 팀' : t}</option>)}
          </select>
          <button onClick={downloadExcel}
            className="ml-auto flex items-center gap-1.5 text-sm font-medium text-[#4A5568] border border-[#DDE3EE] px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Excel 다운로드
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F0F4FA]">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#4A5568]">순위</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#4A5568]">이름</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#4A5568]">팀</th>
                {([ ['총합', 'total'], ['팀장', 'downward'], ['동료', 'peer'], ['상향', 'upward'] ] as [string, SortCol][]).map(([label, col]) => (
                  <th key={col} className="px-4 py-2.5 text-left text-xs font-semibold text-[#4A5568] cursor-pointer select-none hover:text-[#0D1B2A]" onClick={() => toggleSort(col)}>
                    {label}<SortArrow col={col} />
                  </th>
                ))}
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#4A5568]">등급</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const grade = scoreToGrade(row.totalScore)
                return (
                  <tr key={row.id} className="border-t border-[#DDE3EE] hover:bg-[#F8FAFD] transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-[#8896A8]">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[#192628]">{row.name}</td>
                    <td className="px-4 py-3 text-[#8896A8] text-xs">{row.team}</td>
                    <td className="px-4 py-3 font-bold text-[#0D1B2A]">{row.totalScore?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{row.downwardScore?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{row.peerScore?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{row.upwardScore?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${GRADE_BADGE[grade] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-[#8896A8]">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
