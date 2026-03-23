'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F0F4FA]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
