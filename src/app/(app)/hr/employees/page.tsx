'use client'

import { useState, useRef } from 'react'
import Topbar from '@/components/layout/Topbar'
import { useEmployeeStore, type UploadRow } from '@/store/employees'
import * as XLSX from 'xlsx'

const ROLE_LABEL: Record<string, string> = {
  MEMBER: '직원', MANAGER: '팀장', HR_ADMIN: 'HR', SUPER_ADMIN: '슈퍼관리자',
}
const ROLE_COLOR: Record<string, string> = {
  MEMBER:      'bg-gray-100 text-gray-600',
  MANAGER:     'bg-mint-50 text-mint-700 border border-mint-200',
  HR_ADMIN:    'bg-purple-50 text-purple-600 border border-purple-200',
  SUPER_ADMIN: 'bg-amber-50 text-amber-600 border border-amber-200',
}

export default function HREmployeesPage() {
  const { employees, hasUploaded, setFromUpload, resetToMock, removeEmployee } = useEmployeeStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<UploadRow[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)

  function downloadTemplate() {
    const headers = ['이름', '영문명', '이메일', '주민번호앞6자리', '팀명', '직책', '역할(직원/팀장/HR/슈퍼관리자)', '팀장이메일']
    const samples = [
      ['홍길동', 'Gildong Hong', 'gildong@everex.co.kr', '900101', 'Maker 1', '시니어 개발자', '직원', 'manager@everex.co.kr'],
      ['김팀장', 'Manager Kim', 'manager@everex.co.kr', '880505', 'Maker 1', '팀장', '팀장', ''],
      ['이HR', 'HR Lee', 'hr@everex.co.kr', '820910', '', 'HR 팀장', 'HR', ''],
    ]
    const ws = XLSX.utils.aoa_to_sheet([headers, ...samples])
    // 컬럼 너비 설정
    ws['!cols'] = [12, 16, 24, 14, 14, 16, 22, 24].map((wch) => ({ wch }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '직원목록')
    XLSX.writeFile(wb, 'EverEx_직원명단_템플릿.xlsx')
  }

  function handleFile(file: File) {
    if (!file.name.match(/\.xlsx?$/i)) {
      alert('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
      const [, ...dataRows] = rows
      const parsed: UploadRow[] = dataRows
        .filter((r) => r[2]) // 이메일 있는 행만
        .map((r) => ({
          name:         String(r[0] ?? ''),
          nameEng:      r[1] ? String(r[1]) : undefined,
          email:        String(r[2] ?? ''),
          ssnPrefix:    String(r[3] ?? ''),
          team:         String(r[4] ?? ''),
          jobTitle:     r[5] ? String(r[5]) : undefined,
          role:         String(r[6] ?? '직원'),
          managerEmail: r[7] ? String(r[7]) : undefined,
        }))
      setPreview(parsed)
    }
    reader.readAsArrayBuffer(file)
  }

  function confirmUpload() {
    if (!preview) return
    setFromUpload(preview)
    setPreview(null)
    setFileName('')
  }

  const filtered = employees.filter(
    (e) => e.name.includes(search) || e.email.includes(search) || (e.team?.name ?? '').includes(search)
  )

  return (
    <>
      <Topbar title="직원 명단 관리" subtitle={`총 ${employees.length}명${hasUploaded ? ' · 업로드됨' : ' · 기본 데이터'}`} />
      <div className="flex-1 overflow-y-auto p-7 space-y-5 max-w-5xl">

        {/* 업로드 카드 */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#192628]">Excel 직원 명단 업로드</h3>
              <p className="text-xs text-[#8896A8] mt-0.5">이름·이메일·팀·직책·역할·주민번호 앞 6자리 포함</p>
            </div>
            <div className="flex items-center gap-3">
              {hasUploaded && (
                <button
                  onClick={() => { if (confirm('기본 데이터(데모)로 초기화할까요?')) resetToMock() }}
                  className="text-xs text-red-400 hover:text-red-600 hover:underline"
                >
                  초기화
                </button>
              )}
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 text-xs text-mint-600 hover:text-mint-700 font-medium border border-mint-200 bg-mint-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                템플릿 다운로드
              </button>
            </div>
          </div>

          {/* 드래그 앤 드롭 영역 */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragOver
                ? 'border-mint-400 bg-mint-50'
                : 'border-[#DDE3EE] hover:border-mint-300 hover:bg-mint-50/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const f = e.dataTransfer.files[0]
              if (f) handleFile(f)
            }}
            onClick={() => fileRef.current?.click()}
          >
            <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${dragOver ? 'bg-mint-100' : 'bg-[#F0F4FA]'}`}>
              <svg className={dragOver ? 'text-mint-500' : 'text-[#8896A8]'} width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-[#4A5568]">
              {fileName
                ? <span className="text-mint-600">{fileName}</span>
                : 'Excel 파일을 드래그하거나 클릭하여 업로드'}
            </p>
            <p className="text-xs text-[#8896A8] mt-1">.xlsx, .xls 지원</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
            />
          </div>

          {/* 미리보기 */}
          {preview && (
            <div className="mt-4 border border-[#DDE3EE] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFD]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-mint-500" />
                  <p className="text-sm font-medium text-[#192628]">{preview.length}명 미리보기</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setPreview(null); setFileName('') }}
                    className="text-xs text-[#8896A8] hover:underline px-2 py-1"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmUpload}
                    className="text-xs text-white bg-mint-500 hover:bg-mint-600 px-3.5 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    {preview.length}명 업로드 확정
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F0F4FA]">
                      {['이름', '이메일', '팀', '직책', '역할'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#4A5568]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 15).map((r, i) => (
                      <tr key={i} className="border-t border-[#DDE3EE]">
                        <td className="px-4 py-2.5 font-medium text-[#192628]">{r.name}</td>
                        <td className="px-4 py-2.5 text-[#4A5568]">{r.email}</td>
                        <td className="px-4 py-2.5 text-[#4A5568]">{r.team || '-'}</td>
                        <td className="px-4 py-2.5 text-[#4A5568]">{r.jobTitle || '-'}</td>
                        <td className="px-4 py-2.5">
                          <span className="bg-mint-50 text-mint-700 border border-mint-200 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            {r.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 15 && (
                  <p className="text-xs text-[#8896A8] px-4 py-2">외 {preview.length - 15}명 더 있음</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 현재 직원 목록 */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#192628]">현재 직원 목록</h3>
              {hasUploaded && (
                <p className="text-xs text-mint-600 mt-0.5">업로드된 데이터 기준</p>
              )}
            </div>
            <div className="relative w-56">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8896A8]" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름 · 이메일 · 팀 검색"
                className="w-full h-8 pl-8 pr-3 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100"
              />
            </div>
          </div>

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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {emp.name.slice(0, 2)}
                        </div>
                        <span className="font-medium text-[#192628]">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4A5568] text-xs">{emp.email}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{emp.team?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{emp.jobTitle ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[emp.role]}`}>
                        {ROLE_LABEL[emp.role] ?? emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm(`${emp.name}을(를) 목록에서 제거할까요?`))
                            removeEmployee(emp.id)
                        }}
                        className="text-xs text-[#8896A8] hover:text-red-500 transition-colors"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-[#8896A8]">검색 결과가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
