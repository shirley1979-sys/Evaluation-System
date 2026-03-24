// ──────────────────────────────────────────────
// 역할
// ──────────────────────────────────────────────
export type Role = 'MEMBER' | 'MANAGER' | 'EXECUTIVE' | 'HR_ADMIN' | 'SUPER_ADMIN'

// ──────────────────────────────────────────────
// 평가 유형
// ──────────────────────────────────────────────
export type EvalType = 'DOWNWARD' | 'UPWARD' | 'PEER' | 'SELF'
export type QuestionType = 'COMMON' | 'DOWNWARD' | 'UPWARD' | 'PEER' | 'SELF'
export type CyclePhase = 'SETUP' | 'NOMINATION' | 'HR_CONFIRM' | 'EVALUATION' | 'CLOSED' | 'RESULTS_OPEN'
export type NominationStatus = 'PENDING' | 'SUBMITTED' | 'CONFIRMED'
export type SurveyStatus = 'DRAFT' | 'SUBMITTED'
export type IdpGoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
export type NominationGroup = 'TEAMMATE' | 'COLLAB'

// ──────────────────────────────────────────────
// 도메인 모델
// ──────────────────────────────────────────────
export interface Team {
  id: string
  name: string
  managerId: string | null
}

export interface User {
  id: string
  name: string
  nameEng: string | null
  nickname: string | null
  email: string
  role: Role
  teamId: string | null
  team?: Team
  jobTitle: string | null   // 직책 (position, e.g. 팀장)
  jobDuty: string | null    // 직무 (function, e.g. 프론트엔드 개발자)
  hireDate: string | null   // 입사일 (YYYY-MM-DD)
  leaveDate: string | null  // 퇴사일 (YYYY-MM-DD)
  ssnPrefix: string | null  // 주민번호 앞 6자리
  managerEmail: string | null
  isActive: boolean
}

export interface EvalCycle {
  id: string
  year: number
  phase: CyclePhase
  nominationOpenAt: string | null
  nominationCloseAt: string | null
  evalOpenAt: string | null
  evalCloseAt: string | null
  resultOpenAt: string | null
}

export interface Question {
  id: string
  text: string
  description: string | null
  type: QuestionType
  category: string
  anchor1: string | null
  anchor3: string | null
  anchor5: string | null
  order: number
  isActive: boolean
}

export interface Nomination {
  id: string
  cycleId: string
  nominatorId: string
  nomineeId: string
  groupType: NominationGroup
  status: NominationStatus
  nominator?: User
  nominee?: User
}

export interface SurveyAnswer {
  questionId: string
  score: number
}

export interface Survey {
  id: string
  cycleId: string
  surveyorId: string
  targetId: string
  type: EvalType
  status: SurveyStatus
  comment: string
  answers: SurveyAnswer[]
  submittedAt: string | null
  target?: User
  surveyor?: User
}

export interface Score {
  id: string
  cycleId: string
  userId: string
  downwardScore: number | null
  peerScore: number | null
  upwardScore: number | null
  totalScore: number | null
  calibratedScore: number | null
  isCalibrated: boolean
  user?: User
}

export interface IdpGoal {
  id: string
  skill: string
  action: string
  dueDate: string
  status: IdpGoalStatus
}

export interface Idp {
  id: string
  cycleId: string
  userId: string
  strengths: string
  improvements: string
  goals: IdpGoal[]
}

// ──────────────────────────────────────────────
// 리포트 집계
// ──────────────────────────────────────────────
export interface CategoryScore {
  category: string
  avg: number
}

export interface PersonReport {
  user: User
  downwardScore: number | null
  peerScore: number | null
  upwardScore: number | null
  totalScore: number | null
  categoryScores: CategoryScore[]
  peerComments: string[]
  upwardComments: string[]
  peerCount: number
  upwardCount: number
}

// ──────────────────────────────────────────────
// Auth (FE 전용)
// ──────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  teamId: string | null
}
