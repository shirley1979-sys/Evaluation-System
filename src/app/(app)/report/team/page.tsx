'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { MOCK_USERS, MOCK_SCORES, MOCK_SURVEYS, MOCK_CYCLE } from '@/lib/mock'
import { scoreToGrade } from '@/lib/score'

export default function TeamReportPage() {
  const user = useAuthStore((s) => s.user)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!user) return null

  // 팀장이 속한 팀 멤버 (본인 포함 또는 하향평가 대상들)
  const teamMembers = MOCK_USERS.filter(
    (u) => u.teamId === user.teamId && u.id !== user.id && u.isActive
  )

  // 팀 평균 계산
  const teamScores = teamMembers.map((m) => {
    const sc = MOCK_SCORES.find((s) => s.userId === m.id)
    return { member: m, score: sc }
  })

  const avgTotal = (() => {
    const vals = teamScores.map((t) => t.score?.calibratedScore ?? t.score?.totalScore).filter((v): v is number => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  })()

  const sorted = [...teamScores].sort((a, b) => {
    const av = a.score?.calibratedScore ?? a.score?.totalScore ?? 0
    const bv = b.score?.calibratedScore ?? b.score?.totalScore ?? 0
    return bv - av
  })

  const selected = sorted.find((t) => t.member.id === selectedId)

  return (
    <>
      <Topbar title="팀 리포트" subtitle={`${teamMembers.length}명`} />
      <div className="flex-1 overflow-y-auto p-7 space-y-5">

        {/* 팀 요약 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-card p-5 col-span-2 sm:col-span-1">
            <p className="text-xs text-[#8896A8] mb-1">팀 평균 점수</p>
            <p className="text-3xl font-extrabold text-[#0D1B2A]">{avgTotal?.toFixed(2) ?? '-'}</p>
            <p className="text-xs text-[#8896A8] mt-1">/ 5.0</p>
          </div>
          {(['S','A','B'] as const).map((g) => {
            const cnt = sorted.filter((t) => scoreToGrade(t.score?.calibratedScore ?? t.score?.totalScore ?? null) === g).length
            const colors: Record<string, string> = {
              S: 'bg-yellow-50 border-yellow-200 text-yellow-700',
              A: 'bg-blue-50 border-blue-200 text-blue-700',
              B: 'bg-green-50 border-green-200 text-green-700',
            }
            return (
              <div key={g} className={`rounded-2xl p-5 border ${colors[g]}`}>
                <p className="text-xs font-medium mb-1">등급 {g}</p>
                <p className="text-3xl font-extrabold">{cnt}명</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 팀원 목록 */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-semibold text-[#0D1B2A] mb-4">팀원 목록</h3>
            <div className="space-y-2">
              {sorted.map(({ member, score }) => {
                const total = score?.calibratedScore ?? score?.totalScore ?? null
                const grade = scoreToGrade(total)
                const gradeColors: Record<string, string> = {
                  S: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                  A: 'bg-blue-50 text-blue-700 border-blue-200',
                  B: 'bg-green-50 text-green-700 border-green-200',
                  C: 'bg-orange-50 text-orange-700 border-orange-200',
                  D: 'bg-red-50 text-red-700 border-red-200',
                  '-': 'bg-gray-50 text-gray-500 border-gray-200',
                }
                const isSelected = selectedId === member.id
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedId(isSelected ? null : member.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                      isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-[#F8FAFD]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {member.name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0D1B2A] truncate">{member.name}</p>
                      <p className="text-xs text-[#8896A8] truncate">{member.jobTitle ?? '-'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-[#0D1B2A]">{total?.toFixed(1) ?? '-'}</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${gradeColors[grade] ?? gradeColors['-']}`}>
                        {grade}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 선택된 팀원 상세 */}
          <div className="lg:col-span-2">
            {selected ? (
              <MemberDetail member={selected.member} score={selected.score ?? null} />
            ) : (
              <div className="bg-white rounded-2xl shadow-card p-10 flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F0F4FA] flex items-center justify-center mb-3">
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#8896A8" strokeWidth={1.5}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#4A5568]">팀원을 선택하면</p>
                <p className="text-sm text-[#8896A8]">상세 평가 결과를 볼 수 있습니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 전체 평가 현황 테이블 */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DDE3EE]">
            <h3 className="font-semibold text-[#0D1B2A]">팀 전체 평가 결과</h3>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F0F4FA]">
                {['이름', '종합', '등급', '하향', '동료', '상향', '보정'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#4A5568]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ member, score }) => {
                const display = score?.calibratedScore ?? score?.totalScore ?? null
                const grade = scoreToGrade(display)
                const gradeColors: Record<string, string> = {
                  S: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                  A: 'bg-blue-50 text-blue-700 border-blue-200',
                  B: 'bg-green-50 text-green-700 border-green-200',
                  C: 'bg-orange-50 text-orange-700 border-orange-200',
                  D: 'bg-red-50 text-red-700 border-red-200',
                  '-': 'bg-gray-50 text-gray-500 border-gray-200',
                }
                return (
                  <tr
                    key={member.id}
                    className="border-t border-[#DDE3EE] hover:bg-[#F8FAFD] cursor-pointer"
                    onClick={() => setSelectedId(selectedId === member.id ? null : member.id)}
                  >
                    <td className="px-4 py-3 font-medium text-[#0D1B2A]">{member.name}</td>
                    <td className="px-4 py-3 font-bold text-[#0D1B2A]">{display?.toFixed(1) ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${gradeColors[grade] ?? gradeColors['-']}`}>
                        {grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#4A5568]">{score?.downwardScore?.toFixed(1) ?? '-'}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{score?.peerScore?.toFixed(1) ?? '-'}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{score?.upwardScore?.toFixed(1) ?? '-'}</td>
                    <td className="px-4 py-3">
                      {score?.isCalibrated ? (
                        <span className="text-xs text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">보정됨</span>
                      ) : (
                        <span className="text-xs text-[#C8D0E0]">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function MemberDetail({ member, score }: { member: (typeof MOCK_USERS)[0]; score: (typeof MOCK_SCORES)[0] | null }) {
  const surveys = MOCK_SURVEYS.filter(
    (s) => s.targetId === member.id && s.status === 'SUBMITTED' && s.type !== 'SELF'
  )
  const downward = surveys.filter((s) => s.type === 'DOWNWARD')
  const peer = surveys.filter((s) => s.type === 'PEER')

  const display = score?.calibratedScore ?? score?.totalScore ?? null
  const grade = scoreToGrade(display)
  const gradeColors: Record<string, string> = {
    S: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    A: 'text-blue-700 bg-blue-50 border-blue-200',
    B: 'text-green-700 bg-green-50 border-green-200',
    C: 'text-orange-700 bg-orange-50 border-orange-200',
    D: 'text-red-700 bg-red-50 border-red-200',
    '-': 'text-gray-500 bg-gray-50 border-gray-200',
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {member.name.slice(0, 2)}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#0D1B2A] text-base">{member.name}</p>
            <p className="text-xs text-[#8896A8]">{member.jobTitle ?? '-'} · {member.team?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-[#0D1B2A]">{display?.toFixed(2) ?? '-'}</p>
            <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border mt-1 ${gradeColors[grade] ?? gradeColors['-']}`}>
              등급 {grade}
            </span>
          </div>
        </div>
      </div>

      {/* 세부 점수 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '하향 평가', val: score?.downwardScore, weight: '50%', color: 'text-purple-600' },
          { label: '동료 평가', val: score?.peerScore,     weight: '35%', color: 'text-blue-600' },
          { label: '상향 평가', val: score?.upwardScore,   weight: '15%', color: 'text-green-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl shadow-card p-4 text-center">
            <p className="text-xs text-[#8896A8] mb-1">{item.label}</p>
            <p className={`text-2xl font-extrabold ${item.color}`}>{item.val?.toFixed(1) ?? '-'}</p>
            <p className="text-xs text-[#C8D0E0] mt-0.5">가중 {item.weight}</p>
          </div>
        ))}
      </div>

      {/* 팀장 코멘트 */}
      {downward.length > 0 && downward[0].comment && (
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h4 className="text-xs font-semibold text-[#8896A8] uppercase tracking-wide mb-3">팀장 코멘트</h4>
          <p className="text-sm text-[#0D1B2A] leading-relaxed">{downward[0].comment}</p>
        </div>
      )}

      {/* 동료 코멘트 (2명 이상이면 표시) */}
      {peer.length >= 2 && (
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h4 className="text-xs font-semibold text-[#8896A8] uppercase tracking-wide mb-3">
            동료 코멘트 ({peer.length}명)
          </h4>
          <div className="space-y-2">
            {peer.filter((s) => s.comment).map((s, i) => (
              <p key={i} className="text-sm text-[#0D1B2A] leading-relaxed py-2 border-b border-[#F0F4FA] last:border-0">
                {s.comment}
              </p>
            ))}
          </div>
        </div>
      )}
      {peer.length > 0 && peer.length < 2 && (
        <div className="bg-[#F8FAFD] rounded-2xl p-4 text-center">
          <p className="text-xs text-[#8896A8]">동료 코멘트는 2명 이상 응답 시 공개됩니다 (현재 {peer.length}명)</p>
        </div>
      )}
    </div>
  )
}
