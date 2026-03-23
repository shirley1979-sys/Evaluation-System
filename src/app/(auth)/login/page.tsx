'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'

const employeeSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  ssnPrefix: z.string().length(6, '주민번호 앞 6자리를 입력하세요').regex(/^\d+$/, '숫자만 입력하세요'),
})
type EmployeeForm = z.infer<typeof employeeSchema>

function SsnDots({ value }: { value: string }) {
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className={`w-2 h-2 rounded-full transition-all duration-150 ${i < value.length ? 'bg-blue-400 scale-110' : 'bg-white/20'}`} />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { login, demoLogin } = useAuthStore()
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
  })
  const ssnValue = watch('ssnPrefix') ?? ''

  function onSubmit(data: EmployeeForm) {
    const ok = login(data.email, data.ssnPrefix)
    if (ok) {
      router.push('/dashboard')
    } else {
      setError('이메일 또는 주민번호가 올바르지 않습니다.')
    }
  }

  function handleDemo(role: 'member' | 'manager' | 'hr' | 'admin') {
    demoLogin(role)
    router.push('/dashboard')
  }

  return (
    <div className="fixed inset-0 bg-[#080F1A] flex flex-col items-center overflow-y-auto overflow-x-hidden">
      {/* 배경 그라데이션 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[65vw] h-[65vw] rounded-full bg-blue-600/10 blur-[80px] animate-[bgdrift_20s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-yellow-500/6 blur-[80px] animate-[bgdrift2_25s_ease-in-out_infinite_alternate]" />
        {/* 그리드 */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />
      </div>

      <div className="relative z-10 w-full max-w-[440px] mx-auto flex flex-col px-5 py-10 flex-1 justify-center">
        <div className="bg-[rgba(13,24,42,.88)] backdrop-blur-[28px] border border-white/9 rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,.7)] animate-[lc-rise_.55s_cubic-bezier(.22,1,.36,1)_both]">

          {/* 헤더 */}
          <div className="px-9 pt-8 pb-7 bg-gradient-to-br from-blue-600/10 to-transparent border-b border-white/7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-[42px] h-[42px] rounded-[10px] bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-[17px] font-extrabold text-white shadow-[0_4px_18px_rgba(37,99,235,.45)] flex-shrink-0">
                EX
              </div>
              <div>
                <div className="text-[16px] font-bold text-white tracking-wide">EverEx</div>
                <div className="text-[10px] text-white/35 mt-0.5 tracking-widest">HUMAN RESOURCES</div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/22 px-3 py-1 rounded-full text-[10px] font-semibold text-yellow-300 tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
              2026 다면평가
            </div>
            <h1 className="text-[22px] font-bold text-white leading-tight mb-1.5">
              평가 시스템{' '}
              <span className="bg-gradient-to-r from-blue-400 to-yellow-300 bg-clip-text text-transparent">로그인</span>
            </h1>
            <p className="text-[12px] text-white/38 leading-relaxed">이메일과 주민번호 앞 6자리로 로그인하세요</p>
          </div>

          {/* 폼 */}
          <div className="px-9 py-7">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/22 rounded-[9px] px-3.5 py-2.5 text-[12px] text-red-300 mb-5">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* 이메일 */}
              <div>
                <label className="block text-[11px] font-semibold text-white/40 mb-1.5 tracking-widest uppercase">이메일</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/22 pointer-events-none" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email"
                    placeholder="이메일 주소"
                    autoComplete="email"
                    {...register('email')}
                    className="w-full h-[46px] pl-10 pr-4 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13.5px] placeholder:text-white/18 focus:outline-none focus:border-blue-500/70 focus:bg-blue-600/7 focus:shadow-[0_0_0_3px_rgba(37,99,235,.18)] transition-all"
                  />
                </div>
                {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email.message}</p>}
              </div>

              {/* 주민번호 */}
              <div>
                <label className="block text-[11px] font-semibold text-white/40 mb-1.5 tracking-widest uppercase">주민번호 앞 6자리</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/22 pointer-events-none" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="생년월일 6자리 (예: 950312)"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="off"
                    {...register('ssnPrefix')}
                    className="w-full h-[46px] pl-10 pr-20 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13.5px] placeholder:text-white/18 focus:outline-none focus:border-blue-500/70 focus:bg-blue-600/7 focus:shadow-[0_0_0_3px_rgba(37,99,235,.18)] transition-all tracking-[.4em]"
                  />
                  <SsnDots value={ssnValue} />
                </div>
                {errors.ssnPrefix && <p className="text-red-400 text-[11px] mt-1">{errors.ssnPrefix.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-[14px] rounded-[10px] shadow-[0_4px_18px_rgba(37,99,235,.4)] hover:-translate-y-px hover:shadow-[0_7px_24px_rgba(37,99,235,.5)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
              >
                로그인
              </button>
            </form>

            {/* 데모 계정 */}
            <div className="mt-5 pt-5 border-t border-white/6">
              <p className="text-[11px] font-semibold text-white/35 mb-2.5">데모 로그인</p>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { role: 'member' as const,  label: '직원',      hint: '이서연' },
                  { role: 'manager' as const, label: '팀장',      hint: '김민준' },
                  { role: 'hr' as const,      label: 'HR',        hint: 'Shirley' },
                  { role: 'admin' as const,   label: '슈퍼관리자', hint: '관리자' },
                ]).map(({ role, label, hint }) => (
                  <button
                    key={role}
                    onClick={() => handleDemo(role)}
                    className="flex flex-col items-center gap-0.5 py-2.5 bg-white/5 hover:bg-white/9 rounded-xl text-white/50 hover:text-white/75 transition-all"
                  >
                    <span className="text-[11px] font-semibold">{label}</span>
                    <span className="text-[9px] text-white/30">{hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 힌트 */}
            <div className="mt-4 text-[10.5px] text-white/22 leading-relaxed">
              <strong className="text-white/40">데모 계정</strong> 이서연 / seoyeon@everex.co.kr / <span className="tracking-widest">950312</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
