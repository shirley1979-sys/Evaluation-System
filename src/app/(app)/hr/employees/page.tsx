'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Topbar from '@/components/layout/Topbar'
import type { User } from '@/types'
import * as XLSX from 'xlsx'

interface UploadRow {
  name: string
  nameEng?: string
  email: string
  ssnPrefix: string
  team: string
  jobTitle?: string
  role: string
  managerEmail?: string
}

const ROLE_MAP: Record<string, string> = {
  '직원': 'MEMBER', '팀원': 'MEMBER',
  '팀장': 'MANAGER', 'Manager': 'MANAGER',
  'HR': 'HR_ADMIN', 'HR관리자': 'HR_ADMIN',
  '슈퍼관리자': 'SUPER_ADMIN',
}

export default function HREmployeesPage() {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<UploadRow[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [search, setSearch] = useState('')

  const { data: employees = [], isLoading } = useQuery<User[]>({
    queryKey: ['employees'],
    queryFn: () => fetch('/api/employees').then((r) => r.json()),
  })

  const uploadMutation = useMutation({
    mutationFn: (rows: UploadRow[]) =>
      fetch('/api/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: rows }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setPreview(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/employees/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })

  function downloadTemplate() {
    const headers = ['이름', '영문명', '이메일', '주민번호앞6자리', '팀명', '직책', '역할(직원/팀장/HR/슈퍼관리자)', '팀장이메일']
    const sample = ['홍길동', 'Gildong Hong', 'gildong@everex.co.kr', '900101', 'Maker 1', '시니어 개발자', '직원', 'manager@everex.co.kr']
    const ws = XLSX.utils.aoa_to_sheet([headers, sample])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '직원목록')
    XLSX.writeFile(wb, 'EverEx_직원명단_템플릿.xlsx')
  }

  function handleFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
      const [, ...dataRows] = rows
      const parsed: UploadRow[] = dataRows
        .filter((r) => r[2])
        .map((r) => ({
          name: r[0],
          nameEng: r[1],
          email: r[2],
          ssnPrefix: String(r[3]),
          team: r[4],
          jobTitle: r[5],
          role: ROLE_MAP[r[6]] ?? 'MEMBER',
          managerEmail: r[7],
        }))
      setPreview(parsed)
    }
    reader.readAsArrayBuffer(file)
  }

  const filtered = employees.filter(
    (e) => e.name.includes(search) || e.email.includes(search)
  )

  return (
    <>
      <Topbar title="직원 명단 관리" subtitle={`총 ${employees.length}명`} />
      <div className="flex-1 overflow-y-auto p-7 space-y-5">

        {/* 업로드 */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0D1B2A]">Excel 업로드</h3>
            <button onClick={downloadTemplate} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              템플릿 다운로드
            </button>
          </div>

          <div
            className="border-2 border-dashed border-[#DDE3EE] rounded-xl p-8 text-center hover:border-blue-300 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onClick={() => fileRef.current?.click()}
          >
            <svg className="mx-auto mb-2 text-[#8896A8]" width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-sm text-[#8896A8]">{fileName || 'Excel 파일을 드래그하거나 클릭하여 업로드하세요'}</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>

          {preview && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[#0D1B2A]">{preview.length}명 미리보기</p>
                <div className="flex gap-2">
                  <button onClick={() => setPreview(null)} className="text-xs text-[#8896A8] hover:underline">취소</button>
                  <button
                    onClick={() => uploadMutation.mutate(preview)}
                    disabled={uploadMutation.isPending}
                    className="text-xs text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {uploadMutation.isPending ? '업로드 중...' : '업로드 확정'}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F0F4FA]">
                      {['이름', '이메일', '팀', '직책', '역할'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-[#4A5568]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-t border-[#DDE3EE]">
                        <td className="px-3 py-2">{r.name}</td>
                        <td className="px-3 py-2">{r.email}</td>
                        <td className="px-3 py-2">{r.team}</td>
                        <td className="px-3 py-2">{r.jobTitle}</td>
                        <td className="px-3 py-2">{r.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && <p className="text-xs text-[#8896A8] mt-2 px-3">...외 {preview.length - 10}명</p>}
              </div>
            </div>
          )}
        </div>

        {/* 직원 목록 */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0D1B2A]">현재 직원 목록</h3>
            <div className="relative w-52">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8896A8]" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름/이메일 검색"
                className="w-full h-8 pl-8 pr-3 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-blue-400" />
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
                  <tr key={emp.id} className="border-t border-[#DDE3EE] hover:bg-[#F8FAFD]">
                    <td className="px-4 py-3 font-medium text-[#0D1B2A]">{emp.name}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{emp.email}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{(emp as any).team?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-[#4A5568]">{emp.jobTitle ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        emp.role === 'HR_ADMIN' || emp.role === 'SUPER_ADMIN'
                          ? 'bg-purple-50 text-purple-600'
                          : emp.role === 'MANAGER' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {emp.role === 'MEMBER' ? '직원' : emp.role === 'MANAGER' ? '팀장' : emp.role === 'HR_ADMIN' ? 'HR' : '슈퍼관리자'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { if (confirm(`${emp.name}을(를) 삭제하시겠습니까?`)) deleteMutation.mutate(emp.id) }}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && (
              <p className="text-sm text-[#8896A8] text-center py-8">직원이 없습니다</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
