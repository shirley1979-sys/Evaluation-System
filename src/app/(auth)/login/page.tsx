'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'

const loginSchema = z.object({
  email:    z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
})

type LoginForm = z.infer<typeof loginSchema>

const DEMO_PASSWORD = 'Everex2026!'

// ── 로그인 폼 (직원/관리자 공용 — 역할은 로그인 후 profiles.role로 결정) ──
function LoginForm() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [error, setError] = useState('')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setError('')
    const result = await login(data.email, data.password)
    if (result.ok) {
      router.push('/dashboard')
    } else {
      setError(result.error ?? '로그인에 실패했습니다.')
    }
  }

  async function handleDemo(email: string) {
    setError('')
    setValue('email', email)
    const result = await login(email, DEMO_PASSWORD)
    if (result.ok) router.push('/dashboard')
    else setError(result.error ?? '데모 로그인에 실패했습니다.')
  }

  return (
    <div className="px-8 py-8">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-[12.5px] text-red-600 mb-5">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 이메일 */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8896A8] mb-1.5 tracking-wide">이메일</label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8896A8] pointer-events-none" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            <input
              type="email"
              placeholder="이메일 주소"
              autoComplete="email"
              {...register('email')}
              className="w-full h-[46px] pl-10 pr-4 bg-white border border-[#DDE3EE] rounded-xl text-[#192628] text-[13.5px] placeholder:text-[#8896A8] focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100 transition-all"
            />
          </div>
          {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email.message}</p>}
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8896A8] mb-1.5 tracking-wide">비밀번호</label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8896A8] pointer-events-none" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type="password"
              placeholder="비밀번호"
              autoComplete="current-password"
              {...register('password')}
              className="w-full h-[46px] pl-10 pr-4 bg-white border border-[#DDE3EE] rounded-xl text-[#192628] text-[13.5px] placeholder:text-[#8896A8] focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100 transition-all"
            />
          </div>
          {errors.password && <p className="text-red-500 text-[11px] mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-mint-500 hover:bg-mint-600 text-white font-semibold text-[14px] rounded-xl shadow-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
        >
          로그인
        </button>
      </form>

      {/* 데모 로그인 */}
      <div className="mt-6 pt-5 border-t border-[#F0F4FA]">
        <p className="text-[11px] font-semibold text-[#8896A8] mb-2.5">데모 체험</p>
        <div className="grid grid-cols-4 gap-2">
          {([
            { email: 'seoyeon@everex.co.kr', label: '직원',  hint: '이서연' },
            { email: 'minjun@everex.co.kr',  label: '팀장',  hint: '김민준' },
            { email: 'shirley@everex.co.kr', label: 'HR',    hint: 'Shirley' },
            { email: 'admin@everex.co.kr',   label: '관리자', hint: 'Admin' },
          ]).map(({ email, label, hint }) => (
            <button
              key={email}
              type="button"
              onClick={() => handleDemo(email)}
              className="flex flex-col items-center gap-0.5 py-2.5 bg-[#F8FAFD] hover:bg-mint-50 border border-[#F0F4FA] hover:border-mint-200 rounded-xl text-[#4A5568] hover:text-mint-700 transition-colors"
            >
              <span className="text-[11px] font-semibold">{label}</span>
              <span className="text-[9px] text-[#8896A8]">{hint}</span>
            </button>
          ))}
        </div>

        <p className="text-[11px] font-semibold text-[#8896A8] mt-4 mb-2.5">워크플로우 테스트 계정</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { email: 'membertest@everex.co.kr', label: '직원TEST', hint: 'TEST팀 · 팀원' },
            { email: 'leadtest@everex.co.kr',   label: '팀장TEST', hint: 'TEST팀 · 팀장' },
          ]).map(({ email, label, hint }) => (
            <button
              key={email}
              type="button"
              onClick={() => handleDemo(email)}
              className="flex flex-col items-center gap-0.5 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-amber-700 transition-colors"
            >
              <span className="text-[11px] font-semibold">{label}</span>
              <span className="text-[9px] text-amber-600">{hint}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 text-[10.5px] text-[#8896A8] leading-relaxed">
          데모/테스트 계정 공통 비밀번호: <span className="tracking-wide font-medium text-[#4A5568]">{DEMO_PASSWORD}</span>
        </div>
      </div>
    </div>
  )
}

// ── 360° 다면평가 개념을 형상화한 오빗 일러스트 ──
function OrbitIllustration() {
  const orbits = [
    { rx: 58, ry: 44, rotate: -18, dotAngle: 40, dotColor: '#07BEB8', dotR: 6.5 },   // 동료
    { rx: 92, ry: 68, rotate: 12,  dotAngle: -60, dotColor: '#4CC4C2', dotR: 6 },     // 상향
    { rx: 118, ry: 92, rotate: -8, dotAngle: 155, dotColor: '#192628', dotR: 6 },     // 팀장
  ]

  function dotPosition(rx: number, ry: number, rotateDeg: number, angleDeg: number) {
    const rot = (rotateDeg * Math.PI) / 180
    const a = (angleDeg * Math.PI) / 180
    const ex = rx * Math.cos(a)
    const ey = ry * Math.sin(a)
    return {
      x: ex * Math.cos(rot) - ey * Math.sin(rot),
      y: ex * Math.sin(rot) + ey * Math.cos(rot),
    }
  }

  return (
    <div className="hidden xl:block flex-shrink-0" aria-hidden="true">
      <svg width="240" height="240" viewBox="-120 -120 240 240">
        {orbits.map((o, i) => (
          <ellipse
            key={i}
            rx={o.rx} ry={o.ry}
            transform={`rotate(${o.rotate})`}
            fill="none"
            stroke="#DDE3EE"
            strokeWidth="1.5"
          />
        ))}
        {orbits.map((o, i) => {
          const p = dotPosition(o.rx, o.ry, o.rotate, o.dotAngle)
          return (
            <circle key={i} cx={p.x} cy={p.y} r={o.dotR} fill={o.dotColor}>
              <animate
                attributeName="opacity"
                values="1;0.55;1"
                dur={`${3 + i}s`}
                repeatCount="indefinite"
              />
            </circle>
          )
        })}
        {/* 중심: 평가 대상 */}
        <circle cx="0" cy="0" r="17" fill="#192628" />
        <text x="0" y="4.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="Pretendard, sans-serif">ME</text>
      </svg>
    </div>
  )
}

// ── 메인 로그인 페이지 ─────────────────────────
export default function LoginPage() {
  return (
    <div className="fixed inset-0 bg-[#F0F4FA] flex overflow-hidden">
      {/* ── 왼쪽: 브랜드 패널 ── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-white border-r border-[#DDE3EE]">
        {/* 은은한 그리드 텍스처 */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(#192628 1px,transparent 1px),linear-gradient(90deg,#192628 1px,transparent 1px)', backgroundSize: '56px 56px' }} />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* 로고 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint-500 flex items-center justify-center text-[14px] font-extrabold text-white">
              EX
            </div>
            <div>
              <div className="text-[16px] font-bold text-[#192628] tracking-wide">EverEx</div>
              <div className="text-[10px] text-[#8896A8] tracking-widest">HUMAN RESOURCES</div>
            </div>
          </div>

          {/* 메인 카피 */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-mint-50 border border-mint-200 px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-mint-700 tracking-wide mb-6 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-mint-500" />
              2026 다면평가 시즌 진행 중
            </div>

            <div className="flex items-center gap-8 xl:gap-12">
              <div>
                <h1 className="text-[42px] font-extrabold text-[#192628] leading-tight mb-4">
                  성장을 위한<br />
                  <span className="text-mint-600">360°</span> 피드백
                </h1>
                <p className="text-[15px] text-[#4A5568] leading-relaxed max-w-sm">
                  팀장·동료·상향 평가를 통해 다각적인 시각을 반영한<br />
                  공정하고 발전적인 평가 문화를 만들어갑니다.
                </p>
              </div>
              <OrbitIllustration />
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-3 gap-3 mt-10">
              {[
                { value: '90%', label: '목표 참여율' },
                { value: '360°', label: '다면 평가' },
                { value: '4개', label: '평가 유형' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#F8FAFD] border border-[#F0F4FA] rounded-2xl px-4 py-4">
                  <div className="text-[22px] font-extrabold text-mint-600">{stat.value}</div>
                  <div className="text-[11px] text-[#8896A8] mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 평가 사이클 진행 단계 */}
          <div className="border-t border-[#F0F4FA] pt-6">
            <p className="text-[10px] font-semibold text-[#8896A8] uppercase tracking-widest mb-3">평가 사이클 현황</p>
            <div className="flex items-center gap-1.5">
              {[
                { label: '준비', done: true },
                { label: '동료 추천', done: true },
                { label: '평가 실시', active: true },
                { label: '집계', done: false },
                { label: '결과 공개', done: false },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-1.5">
                  {i > 0 && <div className={`w-4 h-px ${step.done || step.active ? 'bg-mint-400' : 'bg-[#DDE3EE]'}`} />}
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${
                    step.active ? 'bg-mint-50 text-mint-700 border border-mint-200' :
                    step.done   ? 'bg-[#F0F4FA] text-[#4A5568]' :
                                  'text-[#8896A8]'
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
      <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col overflow-y-auto bg-[#F0F4FA]">
        <div className="flex flex-col min-h-full justify-center px-5 py-8 lg:px-8 lg:py-10">

          {/* 헤더 */}
          <div className="mb-6">
            {/* 모바일 로고 */}
            <div className="flex items-center gap-2.5 mb-6 lg:hidden">
              <div className="w-9 h-9 rounded-lg bg-mint-500 flex items-center justify-center text-[12px] font-bold text-white">EX</div>
              <div>
                <div className="text-[14px] font-bold text-[#192628]">EverEx</div>
                <div className="text-[9px] text-[#8896A8] tracking-widest">HUMAN RESOURCES</div>
              </div>
            </div>

            <div className="flex items-end justify-between mb-1">
              <div>
                <h2 className="text-[20px] font-bold text-[#192628]">로그인</h2>
                <p className="text-[12px] text-[#8896A8] mt-0.5">이메일과 비밀번호로 로그인하세요</p>
              </div>
            </div>

            <div className="w-8 h-0.5 rounded-full bg-mint-500 mt-3" />
          </div>

          {/* 로그인 폼 카드 */}
          <div className="bg-white border border-[#DDE3EE] rounded-2xl overflow-hidden shadow-card">
            <LoginForm />
          </div>

          <p className="text-center text-[10px] text-[#8896A8] mt-6">
            EverEx © 2026 · HR 문의: shirley@everex.co.kr
          </p>
        </div>
      </div>
    </div>
  )
}
