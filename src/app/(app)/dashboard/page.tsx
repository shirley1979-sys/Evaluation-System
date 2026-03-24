'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useEmployeeStore, type UploadRow } from '@/store/employees'
import { useQuestionsStore, TYPE_LABEL, TYPE_COLOR } from '@/store/questions'
import { useEvalCycleStore, PHASE_ORDER, PHASE_LABEL, PHASE_NEXT_ACTION } from '@/store/cycle'
import { MOCK_SURVEYS, MOCK_USERS, getSurveysForSurveyor } from '@/lib/mock'
import { useNominationStore } from '@/store/nominations'
import { useSelfEvalStore } from '@/store/selfEval'
import type { Role, Question, QuestionType, AuthUser } from '@/types'
import * as XLSX from 'xlsx'

// ── 역할 설정 ─────────────────────────────────
const ROLE_LABEL: Record<Role, string> = {
  MEMBER: '팀원', MANAGER: '팀장', EXECUTIVE: '임원', HR_ADMIN: 'HR', SUPER_ADMIN: '슈퍼관리자',
}
const ROLE_COLOR: Record<Role, string> = {
  MEMBER:      'bg-gray-100 text-gray-600',
  MANAGER:     'bg-mint-50 text-mint-700 border border-mint-200',
  EXECUTIVE:   'bg-blue-50 text-blue-700 border border-blue-200',
  HR_ADMIN:    'bg-purple-50 text-purple-700 border border-purple-200',
  SUPER_ADMIN: 'bg-amber-50 text-amber-700 border border-amber-200',
}
const ALL_ROLES: Role[] = ['MEMBER', 'MANAGER', 'EXECUTIVE', 'HR_ADMIN', 'SUPER_ADMIN']

// ── 사이클 단계 ────────────────────────────────
const CYCLE_PHASE_KO: Record<string, string> = {
  SETUP: '준비', NOMINATION: '동료 추천', HR_CONFIRM: 'HR 확정',
  EVALUATION: '평가 실시', CLOSED: '마감', RESULTS_OPEN: '결과 공개',
}

// ── 메인 라우터 ────────────────────────────────
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null
  const isAdmin = user.role === 'HR_ADMIN' || user.role === 'SUPER_ADMIN'
  return isAdmin ? <AdminDashboard user={user} /> : <MemberDashboard user={user} />
}

// ════════════════════════════════════════════════
// 관리자 대시보드
// ════════════════════════════════════════════════
function AdminDashboard({ user }: { user: AuthUser }) {
  const [tab, setTab] = useState<'employees' | 'progress' | 'questions'>('employees')
  const { phase, advancePhase, prevPhase } = useEvalCycleStore()
  const currentStep = PHASE_ORDER.indexOf(phase)

  return (
    <div className="flex-1 overflow-y-auto bg-[#F0F4FA]">
      {/* 상단 헤더 */}
      <div className="bg-[#0D1B2A] px-7 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] text-mint-400 font-semibold tracking-wider mb-1">관리자 대시보드</p>
            <h1 className="text-xl font-bold text-white">
              안녕하세요, <span className="text-mint-400">{user.name}</span> 님
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">현재 단계</p>
            <p className="text-sm font-bold text-white">{PHASE_LABEL[phase]}</p>
          </div>
        </div>

        {/* 사이클 단계 진행바 */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {PHASE_ORDER.map((p, idx) => {
            const isDone   = idx < currentStep
            const isActive = idx === currentStep
            return (
              <div key={p} className="flex items-center gap-1 flex-shrink-0">
                {idx > 0 && (
                  <div className={`w-4 h-px ${idx <= currentStep ? 'bg-mint-500/60' : 'bg-white/15'}`} />
                )}
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 ${
                  isActive ? 'bg-mint-500/20 text-mint-300 border border-mint-400/40' :
                  isDone   ? 'bg-white/8 text-white/45' : 'text-white/20'
                }`}>
                  {isDone && (
                    <svg width={7} height={7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  {CYCLE_PHASE_KO[p]}
                </span>
              </div>
            )
          })}
        </div>

        {/* 단계 이동 버튼 */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => { if (window.confirm('이전 단계로 되돌리겠습니까?')) prevPhase() }}
            disabled={currentStep === 0}
            className="text-xs text-white/40 hover:text-white/70 disabled:opacity-20 transition-colors"
          >
            ← 이전 단계
          </button>
          {PHASE_NEXT_ACTION[phase] && (
            <button
              onClick={() => { if (window.confirm(`'${PHASE_NEXT_ACTION[phase]}'(으)로 진행하겠습니까?`)) advancePhase() }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#0D1B2A] bg-mint-400 hover:bg-mint-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              {PHASE_NEXT_ACTION[phase]} →
            </button>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-[#DDE3EE] px-7">
        <div className="flex gap-0">
          {[
            { key: 'employees', label: '직원 관리', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
            { key: 'progress',  label: '진행 현황', icon: 'M18 20V10M12 20V4M6 20v-6' },
            { key: 'questions', label: '평가 항목', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-mint-500 text-mint-600'
                  : 'border-transparent text-[#8896A8] hover:text-[#4A5568]'
              }`}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d={icon} />
              </svg>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-7">
        {tab === 'employees' && <EmployeeTab />}
        {tab === 'progress'  && <ProgressTab  phase={phase} />}
        {tab === 'questions' && <QuestionsTab />}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════
// 직원 관리 탭
// ════════════════════════════════════════════════
function EmployeeTab() {
  const { employees, hasUploaded, setFromUpload, resetToMock, removeEmployee, updateRole } = useEmployeeStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<UploadRow[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('ALL')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmp, setNewEmp] = useState({ name: '', email: '', team: '', jobTitle: '', role: 'MEMBER' as Role })

  const teams = ['ALL', ...Array.from(new Set(employees.map((e) => e.team?.name ?? '').filter(Boolean)))]

  const filtered = employees.filter((e) =>
    (teamFilter === 'ALL' || (e.team?.name ?? '') === teamFilter) &&
    (e.name.includes(search) || e.email.includes(search) || (e.team?.name ?? '').includes(search))
  )

  // 컬럼 순서: 성명(0) 주민번호앞6자리(1) 닉네임(2) 입사일(3) 퇴사일(4) 팀명(5) 직책(6) 직무(7) 이메일(8)
  function downloadTemplate() {
    const headers = ['성명', '주민번호앞6자리', '닉네임', '입사일', '퇴사일', '팀명', '직책', '직무', '이메일']
    const rows = MOCK_USERS.map((u) => [
      u.name,
      u.ssnPrefix ?? '',
      u.nickname ?? '',
      u.hireDate ?? '',
      u.leaveDate ?? '',
      u.team?.name ?? '',
      u.jobTitle ?? '',
      u.jobDuty ?? '',
      u.email,
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = [12, 14, 12, 12, 12, 22, 10, 20, 26].map((wch) => ({ wch }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '직원목록')
    XLSX.writeFile(wb, 'EverEx_직원명단_템플릿.xlsx')
  }

  function handleFile(file: File) {
    if (!file.name.match(/\.xlsx?$/i)) { alert('Excel 파일만 업로드 가능합니다.'); return }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
      const [, ...data] = rows
      const parsed: UploadRow[] = data.filter((r) => r[8]).map((r) => ({
        name:      String(r[0] ?? ''),
        ssnPrefix: String(r[1] ?? ''),
        nickname:  r[2] ? String(r[2]) : undefined,
        hireDate:  r[3] ? String(r[3]) : undefined,
        leaveDate: r[4] ? String(r[4]) : undefined,
        team:      String(r[5] ?? ''),
        jobTitle:  r[6] ? String(r[6]) : undefined,
        jobDuty:   r[7] ? String(r[7]) : undefined,
        email:     String(r[8] ?? ''),
        role:      '팀원',
      }))
      setPreview(parsed)
    }
    reader.readAsArrayBuffer(file)
  }

  function addEmployee() {
    if (!newEmp.name || !newEmp.email) return
    const existing = employees.find((e) => e.email === newEmp.email)
    if (existing) { alert('이미 존재하는 이메일입니다.'); return }
    setFromUpload([
      ...employees.map((e) => ({
        name: e.name, nameEng: e.nameEng ?? undefined,
        email: e.email, ssnPrefix: '000000',
        team: e.team?.name ?? '', jobTitle: e.jobTitle ?? undefined,
        role: ROLE_LABEL[e.role], managerEmail: e.managerEmail ?? undefined,
      })),
      { name: newEmp.name, email: newEmp.email, ssnPrefix: '000000', team: newEmp.team, jobTitle: newEmp.jobTitle, role: ROLE_LABEL[newEmp.role] },
    ])
    setNewEmp({ name: '', email: '', team: '', jobTitle: '', role: 'MEMBER' })
    setShowAddForm(false)
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Excel 업로드 카드 */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[#192628]">직원 명단 업로드</h3>
            <p className="text-xs text-[#8896A8] mt-0.5">Excel 파일(.xlsx)로 전체 직원 정보를 한번에 등록하세요</p>
          </div>
          <div className="flex items-center gap-2">
            {hasUploaded && (
              <button
                onClick={() => { if (window.confirm('기본 데모 데이터로 초기화할까요?')) resetToMock() }}
                className="text-xs text-red-400 hover:text-red-600 hover:underline"
              >초기화</button>
            )}
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs font-medium text-mint-600 border border-mint-200 bg-mint-50 px-3 py-1.5 rounded-lg hover:bg-mint-100 transition-colors"
            >
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              템플릿 다운로드
            </button>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver ? 'border-mint-400 bg-mint-50' : 'border-[#DDE3EE] hover:border-mint-300 hover:bg-mint-50/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => fileRef.current?.click()}
        >
          <svg className={`mx-auto mb-2 ${dragOver ? 'text-mint-500' : 'text-[#8896A8]'}`} width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          </svg>
          <p className="text-sm text-[#4A5568]">
            {fileName ? <span className="text-mint-600 font-medium">{fileName}</span> : 'Excel 파일을 드래그하거나 클릭하여 업로드'}
          </p>
          <p className="text-xs text-[#8896A8] mt-0.5">.xlsx, .xls 지원</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
        </div>

        {preview && (
          <div className="mt-4 border border-[#DDE3EE] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8FAFD]">
              <p className="text-sm font-medium text-[#192628]">{preview.length}명 미리보기</p>
              <div className="flex gap-2">
                <button onClick={() => { setPreview(null); setFileName('') }} className="text-xs text-[#8896A8] hover:underline">취소</button>
                <button
                  onClick={() => { setFromUpload(preview); setPreview(null); setFileName('') }}
                  className="text-xs text-white bg-mint-500 hover:bg-mint-600 px-3 py-1 rounded-lg font-medium"
                >
                  {preview.length}명 업로드 확정
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F0F4FA]">
                    {['성명', '주민번호앞6자리', '닉네임', '입사일', '퇴사일', '팀명', '직책', '직무', '이메일'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-[#4A5568] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((r, i) => (
                    <tr key={i} className="border-t border-[#DDE3EE]">
                      <td className="px-3 py-2 font-medium text-[#192628] whitespace-nowrap">{r.name}</td>
                      <td className="px-3 py-2 text-[#4A5568]">{r.ssnPrefix || '-'}</td>
                      <td className="px-3 py-2 text-[#4A5568]">{r.nickname || '-'}</td>
                      <td className="px-3 py-2 text-[#4A5568] whitespace-nowrap">{r.hireDate || '-'}</td>
                      <td className="px-3 py-2 text-[#4A5568] whitespace-nowrap">{r.leaveDate || '-'}</td>
                      <td className="px-3 py-2 text-[#4A5568] whitespace-nowrap">{r.team || '-'}</td>
                      <td className="px-3 py-2 text-[#4A5568]">{r.jobTitle || '-'}</td>
                      <td className="px-3 py-2 text-[#4A5568]">{r.jobDuty || '-'}</td>
                      <td className="px-3 py-2 text-[#4A5568]">{r.email}</td>
                    </tr>
                  ))}
                  {preview.length > 10 && (
                    <tr><td colSpan={9} className="px-3 py-2 text-xs text-[#8896A8] text-center">외 {preview.length - 10}명 더 있음</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 직원 목록 */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[#192628]">직원 목록</h3>
            <p className="text-xs text-[#8896A8] mt-0.5">총 {employees.length}명{hasUploaded ? ' · 업로드됨' : ' · 데모 데이터'}</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}
              className="h-8 px-2.5 border border-[#DDE3EE] rounded-lg text-xs bg-white focus:outline-none focus:border-mint-400">
              {teams.map((t) => <option key={t} value={t}>{t === 'ALL' ? '전체 팀' : t}</option>)}
            </select>
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8896A8]" width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름 · 이메일 검색"
                className="h-8 pl-7 pr-2.5 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-mint-400 w-40" />
            </div>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-mint-500 hover:bg-mint-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              + 직원 추가
            </button>
          </div>
        </div>

        {/* 직원 추가 폼 */}
        {showAddForm && (
          <div className="mb-4 p-4 bg-[#F8FAFD] rounded-xl border border-[#DDE3EE]">
            <p className="text-xs font-semibold text-[#192628] mb-3">신규 직원 추가</p>
            <div className="grid grid-cols-5 gap-2">
              <input value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                placeholder="이름 *" className="h-8 px-2.5 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-mint-400" />
              <input value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                placeholder="이메일 *" className="h-8 px-2.5 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-mint-400" />
              <input value={newEmp.team} onChange={(e) => setNewEmp({ ...newEmp, team: e.target.value })}
                placeholder="팀명" className="h-8 px-2.5 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-mint-400" />
              <input value={newEmp.jobTitle} onChange={(e) => setNewEmp({ ...newEmp, jobTitle: e.target.value })}
                placeholder="직책" className="h-8 px-2.5 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-mint-400" />
              <select value={newEmp.role} onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value as Role })}
                className="h-8 px-2 border border-[#DDE3EE] rounded-lg text-xs bg-white focus:outline-none focus:border-mint-400">
                {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={addEmployee} disabled={!newEmp.name || !newEmp.email}
                className="text-xs font-semibold text-white bg-mint-500 hover:bg-mint-600 disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors">
                추가
              </button>
              <button onClick={() => setShowAddForm(false)} className="text-xs text-[#8896A8] hover:underline px-2 py-1.5">취소</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F0F4FA]">
                {['이름', '이메일', '팀', '직책', '역할', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[#4A5568]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-t border-[#DDE3EE] hover:bg-[#F8FAFD] transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {emp.name.slice(0, 2)}
                      </div>
                      <span className="font-medium text-[#192628] text-sm">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[#4A5568] text-xs">{emp.email}</td>
                  <td className="px-4 py-2.5 text-[#4A5568] text-sm">{emp.team?.name ?? '-'}</td>
                  <td className="px-4 py-2.5 text-[#4A5568] text-sm">{emp.jobTitle ?? '-'}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={emp.role}
                      onChange={(e) => updateRole(emp.id, e.target.value as Role)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-mint-200 ${ROLE_COLOR[emp.role]}`}
                    >
                      {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => { if (window.confirm(`${emp.name}을(를) 삭제할까요?`)) removeEmployee(emp.id) }}
                      className="text-xs text-[#8896A8] hover:text-red-500 transition-colors"
                    >삭제</button>
                  </td>
                </tr>
              ))}
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

// ════════════════════════════════════════════════
// 진행 현황 탭
// ════════════════════════════════════════════════
function ProgressTab({ phase }: { phase: string }) {
  const employees   = useEmployeeStore((s) => s.employees)
  const nomEntries  = useNominationStore((s) => s.entries)
  const selfEntries = useSelfEvalStore((s) => s.entries)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

  const activeEmps = employees.filter((u) => u.isActive && u.role !== 'SUPER_ADMIN' && u.role !== 'HR_ADMIN')
  const total = activeEmps.length

  // 개인별 완료 계산
  function empStatus(emp: (typeof activeEmps)[0]) {
    const surveys   = MOCK_SURVEYS.filter((s) => s.surveyorId === emp.id)
    const selfEntry = selfEntries.find((e) => e.userId === emp.id)
    const nomEntry  = nomEntries.find((e) => e.nominatorId === emp.id)

    const nomDone      = nomEntry?.status === 'HR_CONFIRMED'
    const selfDone     = selfEntry?.status === 'SUBMITTED' || surveys.find((s) => s.type === 'SELF')?.status === 'SUBMITTED'
    const peerSurveys  = surveys.filter((s) => s.type === 'PEER')
    const peerDone     = peerSurveys.length > 0 && peerSurveys.every((s) => s.status === 'SUBMITTED')
    const upwardSurvey = surveys.find((s) => s.type === 'UPWARD')
    const upwardDone   = upwardSurvey ? upwardSurvey.status === 'SUBMITTED' : null
    const downSurveys  = surveys.filter((s) => s.type === 'DOWNWARD')
    const downDone     = downSurveys.length > 0 && downSurveys.every((s) => s.status === 'SUBMITTED')
    const overall      = !!nomDone && !!selfDone && peerDone

    return { nomDone: !!nomDone, selfDone: !!selfDone, peerDone, upwardDone, downDone, overall }
  }

  const matrix = activeEmps.map((emp) => ({ emp, ...empStatus(emp) }))

  // 전체 지표
  const stats = [
    { label: '동료 추천 확정', done: matrix.filter((r) => r.nomDone).length,   color: 'bg-mint-500'   },
    { label: '셀프 평가',     done: matrix.filter((r) => r.selfDone).length,  color: 'bg-blue-500'   },
    { label: '동료 평가',     done: matrix.filter((r) => r.peerDone).length,  color: 'bg-purple-500' },
    { label: '상향 평가',     done: matrix.filter((r) => r.upwardDone === true).length, color: 'bg-amber-500'  },
    { label: '하향 평가',     done: matrix.filter((r) => r.downDone).length,  color: 'bg-rose-500'   },
  ]
  const overallDone = matrix.filter((r) => r.overall).length

  // 팀별 그룹
  const teamMap = new Map<string, typeof activeEmps>()
  for (const emp of activeEmps) {
    const key = emp.team?.name ?? '미배정'
    if (!teamMap.has(key)) teamMap.set(key, [])
    teamMap.get(key)!.push(emp)
  }
  const teams = Array.from(teamMap.entries())
    .map(([name, emps]) => {
      const rows = emps.map((emp) => ({ emp, ...empStatus(emp) }))
      const done = rows.filter((r) => r.overall).length
      const rate = emps.length > 0 ? Math.round((done / emps.length) * 100) : 0
      return { name, emps, rows, done, rate }
    })
    .sort((a, b) => b.emps.length - a.emps.length)

  return (
    <div className="space-y-5 max-w-4xl">

      {/* 전체 평가 현황 */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#192628]">전체 평가 현황</h3>
          <span className="text-xs text-[#8896A8]">{CYCLE_PHASE_KO[phase] ?? phase} 단계</span>
        </div>
        <div className="flex items-center gap-6 mb-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#F0F4FA" strokeWidth="7" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="#07BEB8" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - overallDone / (total || 1))}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-[#192628]">
                {total > 0 ? Math.round(overallDone / total * 100) : 0}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#192628]">전체 완료율</p>
            <p className="text-xs text-[#8896A8] mt-0.5">{overallDone}/{total}명 완료</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {stats.map((s) => {
            const rate = total > 0 ? Math.round((s.done / total) * 100) : 0
            return (
              <div key={s.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-[#192628]">{s.label}</span>
                  <span className="text-xs text-[#8896A8]">{s.done}/{total}명 · {rate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${s.color}`} style={{ width: `${rate}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 팀별 진행률 — 클릭하면 개인 현황 패널 */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <h3 className="font-semibold text-[#192628] mb-4">팀별 진행률</h3>
        <div className="space-y-3">
          {teams.map((team) => {
            const isOpen = selectedTeam === team.name
            return (
              <div key={team.name} className="border border-[#DDE3EE] rounded-xl overflow-hidden">
                {/* 팀 헤더 — 클릭 토글 */}
                <button
                  onClick={() => setSelectedTeam(isOpen ? null : team.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFD] transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-[#192628]">{team.name}</span>
                      <span className="text-xs text-[#8896A8]">{team.emps.length}명</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-1 ${
                        team.rate === 100 ? 'bg-green-50 text-green-600' :
                        team.rate >= 70 ? 'bg-mint-50 text-mint-600' :
                        team.rate >= 40 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'
                      }`}>{team.rate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        team.rate === 100 ? 'bg-green-500' : team.rate >= 70 ? 'bg-mint-500' : team.rate >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                      }`} style={{ width: `${team.rate}%` }} />
                    </div>
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8896A8" strokeWidth={2}
                    className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* 개인별 현황 패널 */}
                {isOpen && (
                  <div className="border-t border-[#DDE3EE] overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F0F4FA]">
                          <th className="px-4 py-2 text-left font-semibold text-[#4A5568]">이름</th>
                          <th className="px-4 py-2 text-left font-semibold text-[#4A5568]">직책</th>
                          <th className="px-4 py-2 text-center font-semibold text-[#4A5568]">동료추천</th>
                          <th className="px-4 py-2 text-center font-semibold text-[#4A5568]">셀프</th>
                          <th className="px-4 py-2 text-center font-semibold text-[#4A5568]">동료</th>
                          <th className="px-4 py-2 text-center font-semibold text-[#4A5568]">상향</th>
                          <th className="px-4 py-2 text-center font-semibold text-[#4A5568]">하향</th>
                          <th className="px-4 py-2 text-center font-semibold text-[#4A5568]">종합</th>
                        </tr>
                      </thead>
                      <tbody>
                        {team.rows.map(({ emp, nomDone, selfDone, peerDone, upwardDone, downDone, overall }) => (
                          <tr key={emp.id} className="border-t border-[#DDE3EE] hover:bg-[#F8FAFD]">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                                  {emp.name.slice(0, 2)}
                                </div>
                                <span className="font-medium text-[#192628] whitespace-nowrap">{emp.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-[#8896A8] whitespace-nowrap">{emp.jobTitle ?? '-'}</td>
                            <StatusCell done={nomDone} />
                            <StatusCell done={selfDone} />
                            <StatusCell done={peerDone} />
                            <StatusCell done={upwardDone} nullable />
                            <StatusCell done={downDone} />
                            <td className="px-4 py-2.5 text-center">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                overall ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                              }`}>{overall ? '완료' : '미완료'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatusCell({ done, nullable = false }: { done: boolean | null; nullable?: boolean }) {
  if (nullable && done === null) {
    return <td className="px-4 py-2.5 text-center"><span className="text-[#DDE3EE]">—</span></td>
  }
  return (
    <td className="px-4 py-2.5 text-center">
      {done
        ? <svg className="inline text-green-500" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
        : <svg className="inline text-red-300"   width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      }
    </td>
  )
}

// ════════════════════════════════════════════════
// 평가 항목 탭
// ════════════════════════════════════════════════
function QuestionsTab() {
  const { questions, updateQuestion, deleteQuestion, toggleActive, addQuestion, resetToMock } = useQuestionsStore()
  const [filter, setFilter] = useState<QuestionType | 'ALL'>('ALL')
  const [editTarget, setEditTarget] = useState<Question | null>(null)
  const [showNew, setShowNew] = useState(false)

  const filtered = filter === 'ALL' ? questions : questions.filter((q) => q.type === filter)

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'COMMON', 'DOWNWARD', 'UPWARD', 'PEER', 'SELF'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === t
                  ? 'bg-mint-500 text-white'
                  : 'bg-white border border-[#DDE3EE] text-[#4A5568] hover:bg-gray-50'
              }`}
            >
              {TYPE_LABEL[t]}
              {t !== 'ALL' && (
                <span className={`ml-1 ${filter === t ? 'text-mint-100' : 'text-[#8896A8]'}`}>
                  {questions.filter((q) => q.type === t).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { if (window.confirm('기본 평가 문항으로 초기화할까요?')) resetToMock() }}
            className="text-xs text-[#8896A8] hover:text-red-500 hover:underline transition-colors"
          >초기화</button>
          <button
            onClick={() => setShowNew(true)}
            className="text-xs font-semibold text-white bg-mint-500 hover:bg-mint-600 px-3 py-1.5 rounded-lg transition-colors"
          >+ 문항 추가</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#F0F4FA]">
              {['#', '유형', '카테고리', '문항 내용', '활성', ''].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[#4A5568]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((q, idx) => (
              <tr key={q.id} className={`border-t border-[#DDE3EE] transition-colors ${!q.isActive ? 'opacity-40' : 'hover:bg-[#F8FAFD]'}`}>
                <td className="px-4 py-3 text-[#8896A8] text-xs">{idx + 1}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[q.type]}`}>
                    {TYPE_LABEL[q.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#8896A8] text-xs whitespace-nowrap">{q.category}</td>
                <td className="px-4 py-3 text-[#0D1B2A] max-w-xs">
                  <p className="truncate text-sm">{q.text}</p>
                  {(q.anchor1 || q.anchor5) && (
                    <p className="text-[10px] text-[#8896A8] mt-0.5">1: {q.anchor1} · 5: {q.anchor5}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(q.id)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${q.isActive ? 'bg-mint-500' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${q.isActive ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => setEditTarget(q)} className="text-xs text-mint-600 hover:underline">수정</button>
                    <button
                      onClick={() => { if (window.confirm('이 문항을 삭제할까요?')) deleteQuestion(q.id) }}
                      className="text-xs text-red-400 hover:underline"
                    >삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-[#8896A8]">해당 유형의 문항이 없습니다</p>
          </div>
        )}
      </div>

      {(editTarget || showNew) && (
        <QuestionModal
          question={editTarget}
          onClose={() => { setEditTarget(null); setShowNew(false) }}
          onSave={(data, id) => {
            if (id) updateQuestion(id, data); else addQuestion(data)
            setEditTarget(null); setShowNew(false)
          }}
        />
      )}
    </div>
  )
}

function QuestionModal({
  question, onClose, onSave,
}: {
  question: Question | null
  onClose: () => void
  onSave: (data: Omit<Question, 'id'>, id?: string) => void
}) {
  const [form, setForm] = useState({
    text:        question?.text ?? '',
    description: question?.description ?? null,
    type:        (question?.type ?? 'COMMON') as QuestionType,
    category:    question?.category ?? '',
    anchor1:     question?.anchor1 ?? null,
    anchor3:     question?.anchor3 ?? null,
    anchor5:     question?.anchor5 ?? null,
    order:       question?.order ?? 99,
    isActive:    question?.isActive ?? true,
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-[#192628] mb-5">{question ? '평가 문항 수정' : '평가 문항 추가'}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#4A5568] mb-1.5 block">유형</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })}
                className="w-full h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm bg-white focus:outline-none focus:border-mint-400">
                {Object.entries(TYPE_LABEL).filter(([k]) => k !== 'ALL').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#4A5568] mb-1.5 block">카테고리</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="예: 업무 성과, 리더십"
                className="w-full h-9 px-3 border border-[#DDE3EE] rounded-lg text-sm focus:outline-none focus:border-mint-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#4A5568] mb-1.5 block">문항 내용 <span className="text-red-400">*</span></label>
            <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={2}
              className="w-full px-3 py-2.5 border border-[#DDE3EE] rounded-lg text-sm resize-none focus:outline-none focus:border-mint-400" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([1, 3, 5] as const).map((v) => (
              <div key={v}>
                <label className="text-xs font-medium text-[#4A5568] mb-1.5 block">{v}점 기준</label>
                <input
                  value={form[`anchor${v}` as 'anchor1' | 'anchor3' | 'anchor5'] ?? ''}
                  onChange={(e) => setForm({ ...form, [`anchor${v}`]: e.target.value || null })}
                  className="w-full h-8 px-2 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-mint-400"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 h-10 border border-[#DDE3EE] text-sm font-medium text-[#4A5568] rounded-xl hover:bg-gray-50">취소</button>
          <button
            onClick={() => { if (form.text.trim() && form.category.trim()) onSave(form, question?.id) }}
            disabled={!form.text.trim() || !form.category.trim()}
            className="flex-1 h-10 bg-mint-500 text-white font-semibold text-sm rounded-xl hover:bg-mint-600 disabled:opacity-40"
          >저장</button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════
// 직원용 대시보드 (기존 유지)
// ════════════════════════════════════════════════
const PHASE_STEPS = ['SETUP', 'NOMINATION', 'HR_CONFIRM', 'EVALUATION', 'CLOSED', 'RESULTS_OPEN']

function MemberDashboard({ user }: { user: AuthUser }) {
  const { phase } = useEvalCycleStore()
  const cycleOpen = phase === 'EVALUATION' || phase === 'HR_CONFIRM'
  const currentStep = PHASE_STEPS.indexOf(phase)

  const mySurveys      = getSurveysForSurveyor(user.id)
  const pendingSurveys = mySurveys.filter((s) => s.status === 'DRAFT')
  const doneSurveys    = mySurveys.filter((s) => s.status === 'SUBMITTED')

  const selfSurvey = MOCK_SURVEYS.find((s) => s.surveyorId === user.id && s.type === 'SELF')
  const selfDone   = selfSurvey?.status === 'SUBMITTED'

  const nomEntry       = useNominationStore((s) => s.getEntry(user.id))
  const nominationDone = !!nomEntry && nomEntry.status !== 'NONE'
  const myNominations  = nomEntry?.nominees ?? []

  const totalTasks = mySurveys.length + 2
  const doneTasks  = doneSurveys.length + (selfDone ? 1 : 0) + (nominationDone ? 1 : 0)
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const tasks = [
    { id: 'nomination', title: '동료 추천', desc: nominationDone ? `${myNominations.length}명 추천 완료` : '함께 일한 동료를 추천하세요', href: '/nomination', done: nominationDone, accent: 'purple' },
    { id: 'self',       title: '셀프 평가', desc: selfDone ? '제출 완료' : '본인의 역량을 자기평가하세요', href: '/survey/self', done: selfDone, accent: 'mint' },
    { id: 'peer',       title: '동료 평가', desc: pendingSurveys.filter((s) => s.type === 'PEER').length === 0 ? '모두 완료' : `미완료 ${pendingSurveys.filter((s) => s.type === 'PEER').length}건`, href: '/survey/peer', done: pendingSurveys.filter((s) => s.type === 'PEER').length === 0 && doneSurveys.length > 0, accent: 'teal' },
    { id: 'upward',     title: '상향 평가', desc: pendingSurveys.find((s) => s.type === 'UPWARD') ? '미완료' : '완료', href: '/survey/upward', done: !pendingSurveys.find((s) => s.type === 'UPWARD') && !!mySurveys.find((s) => s.type === 'UPWARD'), accent: 'amber' },
  ]
  const accentMap = {
    mint:   { bg: 'bg-mint-50',   icon: 'text-mint-500' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500' },
    teal:   { bg: 'bg-teal-50',   icon: 'text-teal-500' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-500' },
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F0F4FA]">
      <div className="relative bg-[#0D1B2A] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-mint-500/8 blur-[80px] translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-mint-700/6 blur-[60px] -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative z-10 px-7 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-mint-300 tracking-wider">{CYCLE_PHASE_KO[phase]}</span>
              </div>
              <h1 className="text-[24px] font-bold text-white leading-tight">
                안녕하세요, <span className="text-mint-400">{user.name}</span> 님 👋
              </h1>
              <p className="text-[13px] text-white/50 mt-1.5">
                {cycleOpen ? (doneTasks === totalTasks ? '모든 평가를 완료했습니다!' : `${totalTasks - doneTasks}가지 항목이 남았습니다`) : '현재 평가 기간이 아닙니다.'}
              </p>
            </div>
            <div className="flex-shrink-0 relative w-[72px] h-[72px]">
              <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle cx="36" cy="36" r="30" fill="none" stroke="#07BEB8" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - progressPct / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[16px] font-bold text-white">{progressPct}%</span>
                <span className="text-[8px] text-white/40">완료</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-6 overflow-x-auto pb-1">
            {PHASE_STEPS.map((p, idx) => {
              const isDone = idx < currentStep; const isActive = idx === currentStep
              return (
                <div key={p} className="flex items-center gap-1 flex-shrink-0">
                  {idx > 0 && <div className={`w-5 h-px ${idx <= currentStep ? 'bg-mint-500/60' : 'bg-white/15'}`} />}
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${
                    isActive ? 'bg-mint-500/20 text-mint-300 border border-mint-400/30' : isDone ? 'bg-white/8 text-white/50' : 'text-white/25'
                  }`}>
                    {isDone && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>}
                    {CYCLE_PHASE_KO[p]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-7 py-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#192628]">평가 항목</h2>
            <span className="text-xs text-[#8896A8]">{doneTasks}/{totalTasks} 완료</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tasks.map((task) => {
              const ac = accentMap[task.accent as keyof typeof accentMap]
              return (
                <Link key={task.id} href={task.href} className="group bg-white rounded-2xl shadow-card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl ${task.done ? 'bg-green-50 text-green-500' : `${ac.bg} ${ac.icon}`} flex items-center justify-center transition-colors`}>
                      {task.done ? (
                        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                          <path d={task.id === 'nomination' ? 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' : task.id === 'self' ? 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' : task.id === 'peer' ? 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' : 'M12 19V5M5 12l7-7 7 7'} />
                        </svg>
                      )}
                    </div>
                    {task.done && <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">완료</span>}
                  </div>
                  <h3 className="text-[13px] font-semibold text-[#192628] mb-0.5">{task.title}</h3>
                  <p className="text-[11px] text-[#8896A8]">{task.desc}</p>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {pendingSurveys.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#192628]">미완료 평가</h3>
                <span className="text-[11px] text-white font-semibold bg-mint-500 px-2 py-0.5 rounded-full">{pendingSurveys.length}</span>
              </div>
              <div className="space-y-1">
                {pendingSurveys.map((s) => (
                  <Link key={s.id} href={s.type === 'PEER' ? '/survey/peer' : '/survey/upward'}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F0F4FA] transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {s.target?.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#192628]">{s.target?.name}</p>
                      <p className="text-[11px] text-[#8896A8]">{s.type === 'PEER' ? '동료 평가' : '상향 평가'}</p>
                    </div>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#C8D0E0" strokeWidth={2} className="group-hover:stroke-[#8896A8] flex-shrink-0">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-3">
            <Link href="/report?preview=1" className="flex items-center gap-4 bg-white rounded-2xl shadow-card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-mint-50 text-mint-500 flex items-center justify-center group-hover:bg-mint-100 transition-colors flex-shrink-0">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#192628]">내 평가 리포트</p>
                <p className="text-[11px] text-[#8896A8]">역량 레이더 차트 · 코멘트 조회</p>
              </div>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#C8D0E0" strokeWidth={2} className="group-hover:stroke-[#8896A8]"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
            <Link href="/idp" className="flex items-center gap-4 bg-white rounded-2xl shadow-card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:bg-purple-100 transition-colors flex-shrink-0">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#192628]">IDP 개발 계획</p>
                <p className="text-[11px] text-[#8896A8]">목표 설정 · 진행 상태 관리</p>
              </div>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#C8D0E0" strokeWidth={2} className="group-hover:stroke-[#8896A8]"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
