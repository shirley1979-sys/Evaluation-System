'use client'

import { useAppStore } from '@/store'

interface TopbarProps {
  title: string
  subtitle?: string
  cycleOpen?: boolean
  children?: React.ReactNode
}

export default function Topbar({ title, subtitle, cycleOpen, children }: TopbarProps) {
  const { toggleSidebar } = useAppStore()

  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-[#DDE3EE] flex items-center px-6 gap-3 shadow-[0_1px_0_#DDE3EE]">
      {/* 모바일 햄버거 */}
      <button
        className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={toggleSidebar}
        aria-label="메뉴 열기"
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h1 className="text-[15px] font-semibold text-[#0D1B2A]">
        {title}
        {subtitle && <span className="text-[12px] font-normal text-[#8896A8] ml-1">{subtitle}</span>}
      </h1>

      <div className="ml-auto flex items-center gap-2.5">
        {cycleOpen !== undefined && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${
            cycleOpen
              ? 'bg-green-500/10 border-green-500/20 text-green-600'
              : 'bg-gray-100 border-gray-200 text-gray-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cycleOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {cycleOpen ? '평가 진행 중' : '평가 준비 중'}
          </div>
        )}
        {children}
      </div>
    </header>
  )
}
