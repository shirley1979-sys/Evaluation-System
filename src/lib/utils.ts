import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** HTML 특수문자 이스케이프 (XSS 방지) */
export function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** 날짜를 'YYYY-MM-DD' 포맷으로 변환 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/** 점수를 소수점 1자리로 표시 */
export function formatScore(score: number | null): string {
  if (score === null) return '-'
  return score.toFixed(1)
}
