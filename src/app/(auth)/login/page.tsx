'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'

// ── 직원 로그인 스키마 ─────────────────────────
const employeeSchema = z.object({
  email:     z.string().email('올바른 이메일을 입력하세요'),
  ssnPrefix: z.string().length(6, '주민번호 앞 6자리를 입력하세요').regex(/^\d+$/, '숫자만 입력하세요'),
})

// ── 관리자 로그인 스키마 ──────────────────────
const adminSchema = z.object({
  id:       z.string().min(1, '아이디를 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
})

type EmployeeForm = z.infer<typeof employeeSchema>
type AdminForm    = z.infer<typeof adminSchema>

// ── 주민번호 도트 표시 ────────────────────────
function SsnDots({ value }: { value: string }) {
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${i < value.length ? 'bg-mint-400 scale-110' : 'bg-white/20'}`} />
      ))}
    </div>
  )
}

// ── 직원 로그인 폼 ────────────────────────────
function EmployeeLoginForm() {
  const router = useRouter()
  const { login, demoLogin } = useAuthStore()
  const [error, setError] = useState('')

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

  function handleDemo(role: 'member' | 'manager' | 'hr') {
    demoLogin(role)
    router.push('/dashboard')
  }

  return (
    <div className="px-8 py-7">
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
              className="w-full h-[46px] pl-10 pr-4 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13.5px] placeholder:text-white/18 focus:outline-none focus:border-mint-500/70 focus:bg-mint-600/7 focus:shadow-[0_0_0_3px_rgba(7,190,184,.15)] transition-all"
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
              type="password"
              placeholder="생년월일 6자리 (예: 950312)"
              maxLength={6}
              inputMode="numeric"
              autoComplete="off"
              {...register('ssnPrefix')}
              className="w-full h-[46px] pl-10 pr-20 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13.5px] placeholder:text-white/18 focus:outline-none focus:border-mint-500/70 focus:bg-mint-600/7 focus:shadow-[0_0_0_3px_rgba(7,190,184,.15)] transition-all tracking-[.4em]"
            />
            <SsnDots value={ssnValue} />
          </div>
          {errors.ssnPrefix && <p className="text-red-400 text-[11px] mt-1">{errors.ssnPrefix.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-gradient-to-br from-mint-500 to-mint-600 text-white font-bold text-[14px] rounded-[10px] shadow-[0_4px_18px_rgba(7,190,184,.35)] hover:-translate-y-px hover:shadow-[0_7px_24px_rgba(7,190,184,.45)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
        >
          로그인
        </button>
      </form>

      {/* 데모 로그인 */}
      <div className="mt-5 pt-5 border-t border-white/6">
        <p className="text-[11px] font-semibold text-white/35 mb-2.5">데모 체험</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { role: 'member'  as const, label: '직원',  hint: '이서연' },
            { role: 'manager' as const, label: '팀장',  hint: '김민준' },
            { role: 'hr'      as const, label: 'HR',    hint: 'Shirley' },
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
        <div className="mt-3 text-[10.5px] text-white/22 leading-relaxed">
          이서연 / seoyeon@everex.co.kr / <span className="tracking-widest">950312</span>
        </div>
      </div>
    </div>
  )
}

// ── 관리자 로그인 폼 ──────────────────────────
function AdminLoginForm({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const { demoLogin } = useAuthStore()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
  })

  function onSubmit(data: AdminForm) {
    // 데모: admin / admin1234
    if (data.id === 'admin' && data.password === 'admin1234') {
      demoLogin('admin')
      router.push('/dashboard')
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <div className="px-8 py-7">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/65 mb-5 transition-colors"
      >
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        직원 로그인으로
      </button>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/22 rounded-[9px] px-3.5 py-2.5 text-[12px] text-red-300 mb-5">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-white/40 mb-1.5 tracking-widest uppercase">관리자 아이디</label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/22 pointer-events-none" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <input
              type="text"
              placeholder="아이디"
              autoComplete="username"
              {...register('id')}
              className="w-full h-[46px] pl-10 pr-4 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13.5px] placeholder:text-white/18 focus:outline-none focus:border-amber-400/70 focus:bg-amber-600/5 focus:shadow-[0_0_0_3px_rgba(245,158,11,.15)] transition-all"
            />
          </div>
          {errors.id && <p className="text-red-400 text-[11px] mt-1">{errors.id.message}</p>}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-white/40 mb-1.5 tracking-widest uppercase">비밀번호</label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/22 pointer-events-none" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type="password"
              placeholder="비밀번호"
              autoComplete="current-password"
              {...register('password')}
              className="w-full h-[46px] pl-10 pr-4 bg-white/5 border border-white/10 rounded-[10px] text-white text-[13.5px] placeholder:text-white/18 focus:outline-none focus:border-amber-400/70 focus:bg-amber-600/5 focus:shadow-[0_0_0_3px_rgba(245,158,11,.15)] transition-all"
            />
          </div>
          {errors.password && <p className="text-red-400 text-[11px] mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-[14px] rounded-[10px] shadow-[0_4px_18px_rgba(245,158,11,.35)] hover:-translate-y-px hover:shadow-[0_7px_24px_rgba(245,158,11,.45)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
        >
          관리자 로그인
        </button>
      </form>

      <div className="mt-4 text-[10.5px] text-white/22">
        데모 계정: admin / admin1234
      </div>
    </div>
  )
}

// ── 메인 로그인 페이지 ─────────────────────────
export default function LoginPage() {
  const [mode, setMode] = useState<'employee' | 'admin'>('employee')

  return (
    <div className="fixed inset-0 bg-[#080F1A] flex overflow-hidden">
      {/* ── 왼쪽: 브랜드 패널 ── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D2B2A] via-[#0a1f1e] to-[#080F1A]" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-mint-500/8 blur-[100px]" />
          <div className="absolute bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-mint-700/6 blur-[80px]" />
          {/* 그리드 */}
          <div className="absolute inset-0 opacity-[0.018]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* 로고 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint-500 to-mint-600 flex items-center justify-center text-[14px] font-extrabold text-white shadow-[0_4px_18px_rgba(7,190,184,.4)]">
              EX
            </div>
            <div>
              <div className="text-[16px] font-bold text-white tracking-wide">EverEx</div>
              <div className="text-[10px] text-white/35 tracking-widest">HUMAN RESOURCES</div>
            </div>
          </div>

          {/* 메인 카피 */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-mint-500/10 border border-mint-500/20 px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-mint-300 tracking-wider mb-6 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-pulse" />
              2026 다면평가 시즌 진행 중
            </div>

            <h1 className="text-[42px] font-extrabold text-white leading-tight mb-4">
              성장을 위한<br />
              <span className="text-mint-400">360°</span> 피드백
            </h1>
            <p className="text-[15px] text-white/50 leading-relaxed max-w-sm">
              팀장·동료·상향 평가를 통해 다각적인 시각을 반영한<br />
              공정하고 발전적인 평가 문화를 만들어갑니다.
            </p>

            {/* 통계 카드 */}
            <div className="grid grid-cols-3 gap-3 mt-10">
              {[
                { value: '90%', label: '목표 참여율' },
                { value: '360°', label: '다면 평가' },
                { value: '4개', label: '평가 유형' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/8 rounded-2xl px-4 py-4">
                  <div className="text-[22px] font-extrabold text-mint-400">{stat.value}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 평가 사이클 진행 단계 */}
          <div className="border-t border-white/7 pt-6">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">평가 사이클 현황</p>
            <div className="flex items-center gap-1.5">
              {[
                { label: '준비', done: true },
                { label: '동료 추천', done: true },
                { label: '평가 실시', active: true },
                { label: '집계', done: false },
                { label: '결과 공개', done: false },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-1.5">
                  {i > 0 && <div className={`w-4 h-px ${step.done || step.active ? 'bg-mint-500/60' : 'bg-white/15'}`} />}
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${
                    step.active ? 'bg-mint-500/20 text-mint-300 border border-mint-500/30' :
                    step.done   ? 'bg-white/8 text-white/50' :
                                  'text-white/25'
                  }`}>
                    {step.done && <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>}
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 오른쪽: 로그인 폼 ── */}
      <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col overflow-y-auto">
        {/* 모바일 전용 배경 */}
        <div className="fixed inset-0 lg:hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[65vw] h-[65vw] rounded-full bg-mint-600/10 blur-[80px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-mint-800/6 blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col min-h-full justify-center px-5 py-8 lg:px-8 lg:py-10 bg-[#0a1518] lg:bg-transparent border-l border-white/5">

          {/* 헤더 */}
          <div className="mb-6">
            {/* 모바일 로고 */}
            <div className="flex items-center gap-2.5 mb-6 lg:hidden">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-mint-500 to-mint-600 flex items-center justify-center text-[12px] font-bold text-white">EX</div>
              <div>
                <div className="text-[14px] font-bold text-white">EverEx</div>
                <div className="text-[9px] text-white/35 tracking-widest">HUMAN RESOURCES</div>
              </div>
            </div>

            {/* 탭 전환 */}
            <div className="flex items-end justify-between mb-1">
              <div>
                <h2 className="text-[20px] font-bold text-white">
                  {mode === 'employee' ? '직원 로그인' : '관리자 로그인'}
                </h2>
                <p className="text-[12px] text-white/38 mt-0.5">
                  {mode === 'employee'
                    ? '이메일과 주민번호 앞 6자리로 로그인'
                    : '관리자 아이디와 비밀번호 입력'}
                </p>
              </div>

              {/* 관리자 모드 토글 */}
              {mode === 'employee' ? (
                <button
                  onClick={() => setMode('admin')}
                  className="text-[11px] text-white/30 hover:text-white/55 transition-colors underline underline-offset-2 pb-0.5"
                >
                  관리자 모드
                </button>
              ) : null}
            </div>

            <div className="w-8 h-0.5 rounded-full bg-mint-500 mt-3" />
          </div>

          {/* 로그인 폼 카드 */}
          <div className="bg-[rgba(13,24,42,.7)] backdrop-blur-[24px] border border-white/8 rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,.6)]">
            {mode === 'employee'
              ? <EmployeeLoginForm />
              : <AdminLoginForm onBack={() => setMode('employee')} />
            }
          </div>

          <p className="text-center text-[10px] text-white/18 mt-6">
            EverEx © 2026 · HR 문의: shirley@everex.co.kr
          </p>
        </div>
      </div>
    </div>
  )
}
