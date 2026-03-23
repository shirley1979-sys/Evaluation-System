import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EverEx 다면평가 2026',
  description: 'EverEx 사내 360도 다면평가 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
