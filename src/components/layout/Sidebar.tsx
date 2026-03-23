'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { useAuthStore } from '@/store/auth'

// ── 내비게이션 메뉴 정의 ──────────────────────
const MEMBER_MENU = [
  {
    section: '내 평가',
    items: [
      { label: '대시보드',   href: '/dashboard',   icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
      { label: '셀프 평가',  href: '/survey/self',  icon: 'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5' },
      { label: '평가 작성',  href: '/survey/peer',  icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
      { label: '동료 추천',  href: '/nomination',   icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    ],
  },
  {
    section: '결과',
    items: [
      { label: '내 리포트',  href: '/report',  icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
      { label: 'IDP',        href: '/idp',     icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
    ],
  },
]

const MANAGER_EXTRA = [
  { label: '팀원 리포트', href: '/report/team', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87' },
]

const HR_MENU = [
  {
    section: 'HR 관리',
    items: [
      { label: '직원 명단',  href: '/hr/employees',   icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
      { label: '평가 문항',  href: '/hr/questions',   icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01' },
      { label: '동료 확정',  href: '/hr/nomination',  icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    ],
  },
  {
    section: '진행 관리',
    items: [
      { label: '전체 진행률',  href: '/hr/progress',    icon: 'M18 20V10M12 20V4M6 20v-6' },
      { label: '전체 리포트',  href: '/hr/reports',     icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
      { label: '캘리브레이션', href: '/hr/calibration', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
    ],
  },
]

function SidebarItem({ label, href, icon }: { label: string; href: string; icon: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] font-medium mb-0.5 transition-all',
        isActive
          ? 'bg-blue-700/50 text-white [&_svg]:opacity-100'
          : 'text-white/55 hover:bg-white/7 hover:text-white/85 [&_svg]:opacity-70'
      )}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d={icon} />
      </svg>
      <span>{label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const { user, logout } = useAuthStore()

  const role = user?.role
  const isHR = role === 'HR_ADMIN' || role === 'SUPER_ADMIN'
  const isManager = role === 'MANAGER' || isHR
  const initials = user?.name?.slice(0, 2) ?? 'EX'

  const roleLabel = role === 'SUPER_ADMIN' ? '슈퍼관리자' : role === 'HR_ADMIN' ? 'HR 관리자' : role === 'MANAGER' ? '팀장' : '직원'

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <>
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-30 w-[220px] flex-shrink-0 flex flex-col bg-[#0D1B2A] overflow-hidden transition-transform duration-250',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* 로고 */}
        <div className="flex items-center gap-2.5 px-[18px] py-5 border-b border-white/7">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
            EX
          </div>
          <div>
            <div className="text-[14px] font-bold text-white tracking-wide">EverEx</div>
            <div className="text-[10px] text-white/40 mt-0.5">다면평가 2026</div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {MEMBER_MENU.map((group) => (
            <div key={group.section}>
              <div className="px-2.5 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest text-white/30 uppercase">
                {group.section}
              </div>
              {group.items.map((item) => <SidebarItem key={item.href} {...item} />)}
            </div>
          ))}

          {isManager && !isHR && (
            <div>
              <div className="px-2.5 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest text-white/30 uppercase">팀 관리</div>
              {MANAGER_EXTRA.map((item) => <SidebarItem key={item.href} {...item} />)}
            </div>
          )}

          {isHR && HR_MENU.map((group) => (
            <div key={group.section}>
              <div className="px-2.5 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest text-white/30 uppercase">{group.section}</div>
              {group.items.map((item) => <SidebarItem key={item.href} {...item} />)}
            </div>
          ))}
        </nav>

        {/* 하단 사용자 */}
        <div className="px-2.5 py-3 border-t border-white/7">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] hover:bg-white/7 transition-colors group"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-white/85 truncate">{user?.name}</div>
              <div className="text-[10px] text-white/35">{roleLabel}</div>
            </div>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white/25 group-hover:text-white/50 flex-shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </aside>
    </>
  )
}
