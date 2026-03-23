import type { CategoryScore, PersonReport, User } from '@/types'

// ── 가중치 상수 ──────────────────────────────
export const WEIGHTS = {
  DOWNWARD: 0.5,
  PEER: 0.35,
  UPWARD: 0.15,
} as const

// 공통 문항 / 유형별 문항 가중치
export const QUESTION_WEIGHTS = {
  COMMON: 0.7,
  TYPE_SPECIFIC: 0.3,
} as const

// 익명 보호 최소 응답자 수
export const ANONYMITY_MIN = {
  PEER: 2,
  UPWARD: 3,
} as const

// ── 항목 점수 계산 ───────────────────────────
/**
 * 항목 점수 = 공통 문항 평균 × 0.7 + 유형별 문항 평균 × 0.3
 */
export function calcItemScore(
  commonScores: number[],
  typeScores: number[]
): number | null {
  if (commonScores.length === 0 && typeScores.length === 0) return null

  const commonAvg =
    commonScores.length > 0
      ? commonScores.reduce((a, b) => a + b, 0) / commonScores.length
      : null

  const typeAvg =
    typeScores.length > 0
      ? typeScores.reduce((a, b) => a + b, 0) / typeScores.length
      : null

  if (commonAvg === null) return typeAvg
  if (typeAvg === null) return commonAvg

  return commonAvg * QUESTION_WEIGHTS.COMMON + typeAvg * QUESTION_WEIGHTS.TYPE_SPECIFIC
}

// ── 응답 집계 → 평균 점수 ─────────────────────
export function avgScores(scores: number[]): number | null {
  if (scores.length === 0) return null
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

// ── 종합 점수 계산 ───────────────────────────
/**
 * 종합 점수 = 팀장평가 × 0.50 + 동료평가 × 0.35 + 상향평가 × 0.15
 * 항목이 없으면 나머지 항목으로 재산정
 */
export function calcTotalScore(
  downwardScore: number | null,
  peerScore: number | null,
  upwardScore: number | null
): number | null {
  const available: { score: number; weight: number }[] = []

  if (downwardScore !== null) available.push({ score: downwardScore, weight: WEIGHTS.DOWNWARD })
  if (peerScore !== null) available.push({ score: peerScore, weight: WEIGHTS.PEER })
  if (upwardScore !== null) available.push({ score: upwardScore, weight: WEIGHTS.UPWARD })

  if (available.length === 0) return null

  const totalWeight = available.reduce((a, b) => a + b.weight, 0)
  const weighted = available.reduce((a, b) => a + b.score * b.weight, 0)

  return weighted / totalWeight
}

// ── 카테고리별 점수 집계 ─────────────────────
export function calcCategoryScores(
  answers: { score: number; question: { category: string } }[]
): CategoryScore[] {
  const map = new Map<string, number[]>()

  for (const answer of answers) {
    const cat = answer.question.category
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(answer.score)
  }

  return Array.from(map.entries()).map(([category, scores]) => ({
    category,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
  }))
}

// ── 점수 반올림 ──────────────────────────────
export function roundScore(score: number | null, digits = 1): number | null {
  if (score === null) return null
  const factor = Math.pow(10, digits)
  return Math.round(score * factor) / factor
}

// ── 익명 보호: 코멘트 공개 여부 ─────────────
export function canShowPeerComments(respondentCount: number): boolean {
  return respondentCount >= ANONYMITY_MIN.PEER
}

export function canShowUpwardComments(respondentCount: number): boolean {
  return respondentCount >= ANONYMITY_MIN.UPWARD
}

// ── 등급 산출 (5점 만점 기준) ────────────────
export function scoreToGrade(score: number | null): string {
  if (score === null) return '-'
  if (score >= 4.5) return 'S'
  if (score >= 3.8) return 'A'
  if (score >= 3.0) return 'B'
  if (score >= 2.0) return 'C'
  return 'D'
}

// ── 개인 리포트 빌드 ─────────────────────────
export interface RawSurveyData {
  type: 'DOWNWARD' | 'UPWARD' | 'PEER'
  submittedAnswers: { score: number; question: { category: string; type: string } }[]
  comment: string | null
}

export function buildPersonReport(
  user: User,
  surveys: RawSurveyData[],
  isHRView = false
): PersonReport {
  const downwardAnswers = surveys
    .filter((s) => s.type === 'DOWNWARD')
    .flatMap((s) => s.submittedAnswers)

  const peerSurveys = surveys.filter((s) => s.type === 'PEER')
  const upwardSurveys = surveys.filter((s) => s.type === 'UPWARD')

  const peerAnswers = peerSurveys.flatMap((s) => s.submittedAnswers)
  const upwardAnswers = upwardSurveys.flatMap((s) => s.submittedAnswers)

  const allAnswers = [...downwardAnswers, ...peerAnswers, ...upwardAnswers]

  const downwardScore = downwardAnswers.length > 0 ? avgScores(downwardAnswers.map((a) => a.score)) : null
  const peerScore = peerAnswers.length > 0 ? avgScores(peerAnswers.map((a) => a.score)) : null
  const upwardScore = upwardAnswers.length > 0 ? avgScores(upwardAnswers.map((a) => a.score)) : null

  const peerComments = peerSurveys.map((s) => s.comment).filter(Boolean) as string[]
  const upwardComments = upwardSurveys.map((s) => s.comment).filter(Boolean) as string[]

  const showPeerComments = isHRView || canShowPeerComments(peerSurveys.length)
  const showUpwardComments = isHRView || canShowUpwardComments(upwardSurveys.length)

  return {
    user,
    downwardScore: roundScore(downwardScore),
    peerScore: roundScore(peerScore),
    upwardScore: roundScore(upwardScore),
    totalScore: roundScore(calcTotalScore(downwardScore, peerScore, upwardScore)),
    categoryScores: calcCategoryScores(allAnswers),
    peerComments: showPeerComments ? peerComments : [],
    upwardComments: showUpwardComments ? upwardComments : [],
    peerCount: peerSurveys.length,
    upwardCount: upwardSurveys.length,
  }
}
