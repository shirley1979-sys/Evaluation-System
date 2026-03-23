import type {
  User, Team, EvalCycle, Question, Nomination,
  Survey, Score, Idp, IdpGoal
} from '@/types'

// ──────────────────────────────────────────────
// 팀
// ──────────────────────────────────────────────
export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Maker 1 Motion Insight', managerId: 'u2' },
  { id: 't2', name: 'Global Platform',         managerId: 'u7' },
  { id: 't3', name: 'Design Studio',           managerId: 'u11' },
  { id: 't4', name: 'Data Intelligence',       managerId: 'u14' },
]

// ──────────────────────────────────────────────
// 직원
// ──────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  // Maker 1
  { id: 'u1',  name: '이서연', nameEng: 'Seoyeon', email: 'seoyeon@everex.co.kr',  role: 'MEMBER',     teamId: 't1', team: MOCK_TEAMS[0], jobTitle: '프론트엔드 개발자', managerEmail: 'minjun@everex.co.kr', isActive: true },
  { id: 'u2',  name: '김민준', nameEng: 'Minjun',  email: 'minjun@everex.co.kr',   role: 'MANAGER',    teamId: 't1', team: MOCK_TEAMS[0], jobTitle: '팀장',               managerEmail: null, isActive: true },
  { id: 'u3',  name: '박지호', nameEng: 'Jiho',    email: 'jiho@everex.co.kr',     role: 'MEMBER',     teamId: 't1', team: MOCK_TEAMS[0], jobTitle: '백엔드 개발자',      managerEmail: 'minjun@everex.co.kr', isActive: true },
  { id: 'u4',  name: '최수아', nameEng: 'Sua',     email: 'sua@everex.co.kr',      role: 'MEMBER',     teamId: 't1', team: MOCK_TEAMS[0], jobTitle: 'QA 엔지니어',       managerEmail: 'minjun@everex.co.kr', isActive: true },
  { id: 'u5',  name: '정하은', nameEng: 'Haeun',   email: 'haeun@everex.co.kr',    role: 'MEMBER',     teamId: 't1', team: MOCK_TEAMS[0], jobTitle: '백엔드 개발자',      managerEmail: 'minjun@everex.co.kr', isActive: true },
  // Global Platform
  { id: 'u6',  name: '오준혁', nameEng: 'Junhyuk', email: 'junhyuk@everex.co.kr',  role: 'MEMBER',     teamId: 't2', team: MOCK_TEAMS[1], jobTitle: '풀스택 개발자',      managerEmail: 'yuri@everex.co.kr', isActive: true },
  { id: 'u7',  name: '한유리', nameEng: 'Yuri',    email: 'yuri@everex.co.kr',     role: 'MANAGER',    teamId: 't2', team: MOCK_TEAMS[1], jobTitle: '팀장',               managerEmail: null, isActive: true },
  { id: 'u8',  name: '윤태양', nameEng: 'Taeyang', email: 'taeyang@everex.co.kr',  role: 'MEMBER',     teamId: 't2', team: MOCK_TEAMS[1], jobTitle: '데브옵스 엔지니어',  managerEmail: 'yuri@everex.co.kr', isActive: true },
  { id: 'u9',  name: '임나라', nameEng: 'Nara',    email: 'nara@everex.co.kr',     role: 'MEMBER',     teamId: 't2', team: MOCK_TEAMS[1], jobTitle: '프론트엔드 개발자',  managerEmail: 'yuri@everex.co.kr', isActive: true },
  // Design Studio
  { id: 'u10', name: '강다인', nameEng: 'Dain',    email: 'dain@everex.co.kr',     role: 'MEMBER',     teamId: 't3', team: MOCK_TEAMS[2], jobTitle: 'UX 디자이너',       managerEmail: 'soyeon@everex.co.kr', isActive: true },
  { id: 'u11', name: '신소연', nameEng: 'Soyeon',  email: 'soyeon@everex.co.kr',   role: 'MANAGER',    teamId: 't3', team: MOCK_TEAMS[2], jobTitle: '팀장',               managerEmail: null, isActive: true },
  { id: 'u12', name: '백승우', nameEng: 'Seungwoo',email: 'seungwoo@everex.co.kr', role: 'MEMBER',     teamId: 't3', team: MOCK_TEAMS[2], jobTitle: '프로덕트 디자이너', managerEmail: 'soyeon@everex.co.kr', isActive: true },
  // Data Intelligence
  { id: 'u13', name: '류채원', nameEng: 'Chaewon', email: 'chaewon@everex.co.kr',  role: 'MEMBER',     teamId: 't4', team: MOCK_TEAMS[3], jobTitle: '데이터 사이언티스트', managerEmail: 'woosung@everex.co.kr', isActive: true },
  { id: 'u14', name: '문우성', nameEng: 'Woosung', email: 'woosung@everex.co.kr',  role: 'MANAGER',    teamId: 't4', team: MOCK_TEAMS[3], jobTitle: '팀장',               managerEmail: null, isActive: true },
  // HR
  { id: 'u15', name: 'Shirley',nameEng: 'Shirley', email: 'shirley@everex.co.kr',  role: 'HR_ADMIN',   teamId: null, team: undefined, jobTitle: 'HR 팀장', managerEmail: null, isActive: true },
  { id: 'u16', name: '관리자', nameEng: 'Admin',   email: 'admin@everex.co.kr',    role: 'SUPER_ADMIN',teamId: null, team: undefined, jobTitle: '슈퍼관리자', managerEmail: null, isActive: true },
]

// ──────────────────────────────────────────────
// 데모 로그인 계정 (ssnPrefix: 주민번호 앞 6자리)
// ──────────────────────────────────────────────
export const DEMO_ACCOUNTS: { email: string; ssnPrefix: string; userId: string }[] = [
  { email: 'seoyeon@everex.co.kr',  ssnPrefix: '950312', userId: 'u1'  }, // 직원
  { email: 'minjun@everex.co.kr',   ssnPrefix: '880621', userId: 'u2'  }, // 팀장
  { email: 'shirley@everex.co.kr',  ssnPrefix: '820905', userId: 'u15' }, // HR
  { email: 'admin@everex.co.kr',    ssnPrefix: '800101', userId: 'u16' }, // 슈퍼
]

// ──────────────────────────────────────────────
// 평가 사이클
// ──────────────────────────────────────────────
export const MOCK_CYCLE: EvalCycle = {
  id: 'cycle2026',
  year: 2026,
  phase: 'EVALUATION',
  nominationOpenAt: '2026-03-01',
  nominationCloseAt: '2026-03-05',
  evalOpenAt: '2026-03-10',
  evalCloseAt: '2026-03-31',
  resultOpenAt: null,
}

// ──────────────────────────────────────────────
// 평가 문항 (27개)
// ──────────────────────────────────────────────
export const MOCK_QUESTIONS: Question[] = [
  // 공통 (7)
  { id: 'c1', type: 'COMMON', category: '업무 성과', text: '담당 업무의 산출물이 목표한 품질과 기한을 충족하고 있다', description: null, anchor1: '기한·품질 모두 미달', anchor3: '기한 준수, 품질 보통', anchor5: '기한 준수, 품질 탁월', order: 1, isActive: true },
  { id: 'c2', type: 'COMMON', category: '업무 성과', text: '맡은 업무의 범위와 복잡도에 비해 높은 생산성을 발휘한다', description: null, anchor1: '기대 이하', anchor3: '기대 수준', anchor5: '기대 이상', order: 2, isActive: true },
  { id: 'c3', type: 'COMMON', category: '협업/소통', text: '동료와의 소통이 명확하고 협업에 긍정적인 영향을 준다', description: null, anchor1: '소통 부족', anchor3: '보통', anchor5: '탁월한 소통', order: 3, isActive: true },
  { id: 'c4', type: 'COMMON', category: '협업/소통', text: '갈등 상황에서 건설적으로 문제를 해결하려고 노력한다', description: null, anchor1: '회피/악화', anchor3: '보통', anchor5: '적극 해결', order: 4, isActive: true },
  { id: 'c5', type: 'COMMON', category: '성장/학습', text: '새로운 기술이나 방법을 빠르게 습득하고 업무에 적용한다', description: null, anchor1: '변화 거부', anchor3: '보통', anchor5: '선도적 학습', order: 5, isActive: true },
  { id: 'c6', type: 'COMMON', category: '성장/학습', text: '피드백을 열린 자세로 수용하고 개선하려는 모습을 보인다', description: null, anchor1: '방어적', anchor3: '보통', anchor5: '적극 수용', order: 6, isActive: true },
  { id: 'c7', type: 'COMMON', category: '주도성', text: '지시 없이도 필요한 일을 스스로 찾아 실행한다', description: null, anchor1: '지시 의존', anchor3: '보통', anchor5: '완전 자기주도', order: 7, isActive: true },
  // 하향 (5)
  { id: 'm1', type: 'DOWNWARD', category: '리더십', text: '팀원의 성장을 위한 코칭과 피드백을 꾸준히 제공한다', description: null, anchor1: '피드백 없음', anchor3: '가끔 제공', anchor5: '정기적·효과적', order: 1, isActive: true },
  { id: 'm2', type: 'DOWNWARD', category: '리더십', text: '팀 목표를 명확히 설정하고 방향을 제시한다', description: null, anchor1: '방향 부재', anchor3: '보통', anchor5: '명확한 비전', order: 2, isActive: true },
  { id: 'm3', type: 'DOWNWARD', category: '의사결정', text: '데이터와 논리를 근거로 합리적인 의사결정을 내린다', description: null, anchor1: '감에 의존', anchor3: '보통', anchor5: '체계적 결정', order: 3, isActive: true },
  { id: 'm4', type: 'DOWNWARD', category: '팀 운영', text: '팀원 각자의 강점을 파악하고 적절히 업무를 배분한다', description: null, anchor1: '획일적 배분', anchor3: '보통', anchor5: '최적 배분', order: 4, isActive: true },
  { id: 'm5', type: 'DOWNWARD', category: '팀 운영', text: '어려움에 처한 팀원을 발견하고 지원을 아끼지 않는다', description: null, anchor1: '무관심', anchor3: '필요 시 지원', anchor5: '선제적 지원', order: 5, isActive: true },
  // 상향 (5)
  { id: 'u1', type: 'UPWARD', category: '심리적 안전', text: '의견을 자유롭게 표현할 수 있는 환경을 만들어준다', description: null, anchor1: '눈치 봄', anchor3: '보통', anchor5: '완전히 자유', order: 1, isActive: true },
  { id: 'u2', type: 'UPWARD', category: '심리적 안전', text: '팀원의 실수를 성장의 기회로 보고 비난하지 않는다', description: null, anchor1: '비난·비판', anchor3: '보통', anchor5: '성장 중심', order: 2, isActive: true },
  { id: 'u3', type: 'UPWARD', category: '지원', text: '필요한 자원과 정보를 적시에 제공한다', description: null, anchor1: '정보 부족', anchor3: '보통', anchor5: '충분한 지원', order: 3, isActive: true },
  { id: 'u4', type: 'UPWARD', category: '공정성', text: '팀원을 공정하게 평가하고 기회를 균등하게 부여한다', description: null, anchor1: '편향됨', anchor3: '보통', anchor5: '매우 공정', order: 4, isActive: true },
  { id: 'u5', type: 'UPWARD', category: '커뮤니케이션', text: '팀과 조직의 방향을 투명하게 공유한다', description: null, anchor1: '불투명', anchor3: '보통', anchor5: '완전 투명', order: 5, isActive: true },
  // 동료 (5)
  { id: 'p1', type: 'PEER', category: '신뢰', text: '약속한 것을 기한 내에 완수하여 신뢰를 쌓는다', description: null, anchor1: '자주 미이행', anchor3: '보통', anchor5: '항상 이행', order: 1, isActive: true },
  { id: 'p2', type: 'PEER', category: '신뢰', text: '어려운 상황에서도 팀을 위해 책임을 다한다', description: null, anchor1: '회피', anchor3: '보통', anchor5: '책임 완수', order: 2, isActive: true },
  { id: 'p3', type: 'PEER', category: '기여', text: '팀의 공동 목표 달성에 적극적으로 기여한다', description: null, anchor1: '개인 중심', anchor3: '보통', anchor5: '팀 최우선', order: 3, isActive: true },
  { id: 'p4', type: 'PEER', category: '기여', text: '업무 외 시간에도 동료를 기꺼이 돕는다', description: null, anchor1: '비협조적', anchor3: '요청 시 도움', anchor5: '자발적 지원', order: 4, isActive: true },
  { id: 'p5', type: 'PEER', category: '전문성 공유', text: '본인의 전문 지식을 팀과 적극적으로 공유한다', description: null, anchor1: '공유 없음', anchor3: '요청 시 공유', anchor5: '자발적 공유', order: 5, isActive: true },
  // 셀프 (5)
  { id: 's1', type: 'SELF', category: '자기 인식', text: '나의 강점과 약점을 명확히 파악하고 있다', description: null, anchor1: '인식 부족', anchor3: '보통', anchor5: '매우 명확', order: 1, isActive: true },
  { id: 's2', type: 'SELF', category: '자기 인식', text: '일과 삶의 균형을 적절히 유지하고 있다', description: null, anchor1: '심각한 불균형', anchor3: '보통', anchor5: '잘 유지', order: 2, isActive: true },
  { id: 's3', type: 'SELF', category: '목표 관리', text: '분기 목표를 구체적으로 설정하고 실행한다', description: null, anchor1: '목표 없음', anchor3: '보통', anchor5: '체계적 관리', order: 3, isActive: true },
  { id: 's4', type: 'SELF', category: '목표 관리', text: '업무 우선순위를 효과적으로 관리한다', description: null, anchor1: '우선순위 혼란', anchor3: '보통', anchor5: '완벽한 관리', order: 4, isActive: true },
  { id: 's5', type: 'SELF', category: '성장', text: '올해 목표했던 역량 개발을 충분히 이루었다', description: null, anchor1: '거의 없음', anchor3: '보통', anchor5: '완전 달성', order: 5, isActive: true },
]

// ──────────────────────────────────────────────
// 동료 추천 (이서연 기준)
// ──────────────────────────────────────────────
export const MOCK_NOMINATIONS: Nomination[] = [
  { id: 'n1', cycleId: 'cycle2026', nominatorId: 'u1', nomineeId: 'u3', groupType: 'TEAMMATE',  status: 'CONFIRMED', nominator: MOCK_USERS[0], nominee: MOCK_USERS[2] },
  { id: 'n2', cycleId: 'cycle2026', nominatorId: 'u1', nomineeId: 'u4', groupType: 'TEAMMATE',  status: 'CONFIRMED', nominator: MOCK_USERS[0], nominee: MOCK_USERS[3] },
  { id: 'n3', cycleId: 'cycle2026', nominatorId: 'u1', nomineeId: 'u5', groupType: 'TEAMMATE',  status: 'CONFIRMED', nominator: MOCK_USERS[0], nominee: MOCK_USERS[4] },
  { id: 'n4', cycleId: 'cycle2026', nominatorId: 'u1', nomineeId: 'u6', groupType: 'COLLAB',    status: 'CONFIRMED', nominator: MOCK_USERS[0], nominee: MOCK_USERS[5] },
  { id: 'n5', cycleId: 'cycle2026', nominatorId: 'u1', nomineeId: 'u10',groupType: 'COLLAB',    status: 'SUBMITTED', nominator: MOCK_USERS[0], nominee: MOCK_USERS[9] },
]

// ──────────────────────────────────────────────
// 평가 응답 (이서연이 받은 평가)
// ──────────────────────────────────────────────
const makeAnswers = (scores: number[], qIds: string[]) =>
  qIds.map((questionId, i) => ({ questionId, score: scores[i] ?? 3 }))

export const MOCK_SURVEYS: Survey[] = [
  // 이서연이 받은 하향 평가 (팀장 김민준)
  {
    id: 'sv1', cycleId: 'cycle2026', surveyorId: 'u2', targetId: 'u1', type: 'DOWNWARD',
    status: 'SUBMITTED', submittedAt: '2026-03-15T10:00:00Z',
    comment: '뛰어난 실행력과 꼼꼼한 업무 처리 능력이 돋보입니다.',
    answers: makeAnswers([5,4,5,4,4,5,4, 4,5,4,5,4], ['c1','c2','c3','c4','c5','c6','c7','m1','m2','m3','m4','m5']),
    target: MOCK_USERS[0], surveyor: MOCK_USERS[1],
  },
  // 이서연이 받은 동료 평가 3건
  {
    id: 'sv2', cycleId: 'cycle2026', surveyorId: 'u3', targetId: 'u1', type: 'PEER',
    status: 'SUBMITTED', submittedAt: '2026-03-16T09:00:00Z',
    comment: '항상 적극적으로 도와주고 지식 공유에 앞장서는 동료입니다.',
    answers: makeAnswers([5,4,5,4,5, 4,5,4,5,4,5,4], ['c1','c2','c3','c4','c5','c6','c7','p1','p2','p3','p4','p5']),
    target: MOCK_USERS[0], surveyor: MOCK_USERS[2],
  },
  {
    id: 'sv3', cycleId: 'cycle2026', surveyorId: 'u4', targetId: 'u1', type: 'PEER',
    status: 'SUBMITTED', submittedAt: '2026-03-16T14:00:00Z',
    comment: '커뮤니케이션이 명확하고 책임감이 강합니다.',
    answers: makeAnswers([4,5,4,5,4, 5,4,5,4,5,4,3], ['c1','c2','c3','c4','c5','c6','c7','p1','p2','p3','p4','p5']),
    target: MOCK_USERS[0], surveyor: MOCK_USERS[3],
  },
  {
    id: 'sv4', cycleId: 'cycle2026', surveyorId: 'u6', targetId: 'u1', type: 'PEER',
    status: 'SUBMITTED', submittedAt: '2026-03-17T11:00:00Z',
    comment: null as unknown as string,
    answers: makeAnswers([4,4,5,4,4, 4,4,4,4,4,4,4], ['c1','c2','c3','c4','c5','c6','c7','p1','p2','p3','p4','p5']),
    target: MOCK_USERS[0], surveyor: MOCK_USERS[5],
  },
  // 이서연의 셀프 평가
  {
    id: 'sv5', cycleId: 'cycle2026', surveyorId: 'u1', targetId: 'u1', type: 'SELF',
    status: 'SUBMITTED', submittedAt: '2026-03-14T09:00:00Z',
    comment: '',
    answers: makeAnswers([4,4,4,3,4,4,3,4,4,4,4,4], ['c1','c2','c3','c4','c5','c6','c7','s1','s2','s3','s4','s5']),
    target: MOCK_USERS[0], surveyor: MOCK_USERS[0],
  },
  // 이서연이 작성해야 할 평가 (미완료 포함)
  {
    id: 'sv6', cycleId: 'cycle2026', surveyorId: 'u1', targetId: 'u3', type: 'PEER',
    status: 'DRAFT', submittedAt: null,
    comment: '', answers: [],
    target: MOCK_USERS[2], surveyor: MOCK_USERS[0],
  },
  {
    id: 'sv7', cycleId: 'cycle2026', surveyorId: 'u1', targetId: 'u4', type: 'PEER',
    status: 'SUBMITTED', submittedAt: '2026-03-15T16:00:00Z',
    comment: '매우 꼼꼼하고 신중한 동료입니다.',
    answers: makeAnswers([4,4,5,4,3,4,4,4,4,4,4,4], ['c1','c2','c3','c4','c5','c6','c7','p1','p2','p3','p4','p5']),
    target: MOCK_USERS[3], surveyor: MOCK_USERS[0],
  },
  {
    id: 'sv8', cycleId: 'cycle2026', surveyorId: 'u1', targetId: 'u2', type: 'UPWARD',
    status: 'DRAFT', submittedAt: null,
    comment: '', answers: [],
    target: MOCK_USERS[1], surveyor: MOCK_USERS[0],
  },
]

// ──────────────────────────────────────────────
// 집계 점수
// ──────────────────────────────────────────────
export const MOCK_SCORES: Score[] = [
  { id: 'sc1',  cycleId: 'cycle2026', userId: 'u1',  downwardScore: 4.4, peerScore: 4.5, upwardScore: null, totalScore: 4.5, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[0]  },
  { id: 'sc2',  cycleId: 'cycle2026', userId: 'u2',  downwardScore: null, peerScore: 4.1, upwardScore: 4.2, totalScore: 4.1, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[1]  },
  { id: 'sc3',  cycleId: 'cycle2026', userId: 'u3',  downwardScore: 3.8, peerScore: 3.9, upwardScore: null, totalScore: 3.8, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[2]  },
  { id: 'sc4',  cycleId: 'cycle2026', userId: 'u4',  downwardScore: 4.0, peerScore: 4.2, upwardScore: null, totalScore: 4.1, calibratedScore: 4.1, isCalibrated: true,  user: MOCK_USERS[3]  },
  { id: 'sc5',  cycleId: 'cycle2026', userId: 'u5',  downwardScore: 3.5, peerScore: 3.7, upwardScore: null, totalScore: 3.6, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[4]  },
  { id: 'sc6',  cycleId: 'cycle2026', userId: 'u6',  downwardScore: 4.2, peerScore: 4.3, upwardScore: null, totalScore: 4.2, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[5]  },
  { id: 'sc7',  cycleId: 'cycle2026', userId: 'u7',  downwardScore: null, peerScore: 3.9, upwardScore: 4.0, totalScore: 3.9, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[6]  },
  { id: 'sc8',  cycleId: 'cycle2026', userId: 'u8',  downwardScore: 3.7, peerScore: 3.8, upwardScore: null, totalScore: 3.7, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[7]  },
  { id: 'sc9',  cycleId: 'cycle2026', userId: 'u9',  downwardScore: 4.1, peerScore: 4.0, upwardScore: null, totalScore: 4.1, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[8]  },
  { id: 'sc10', cycleId: 'cycle2026', userId: 'u10', downwardScore: 4.3, peerScore: 4.4, upwardScore: null, totalScore: 4.3, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[9]  },
  { id: 'sc11', cycleId: 'cycle2026', userId: 'u11', downwardScore: null, peerScore: 4.2, upwardScore: 4.1, totalScore: 4.2, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[10] },
  { id: 'sc12', cycleId: 'cycle2026', userId: 'u12', downwardScore: 3.6, peerScore: 3.5, upwardScore: null, totalScore: 3.5, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[11] },
  { id: 'sc13', cycleId: 'cycle2026', userId: 'u13', downwardScore: 4.5, peerScore: 4.6, upwardScore: null, totalScore: 4.6, calibratedScore: 4.6, isCalibrated: true,  user: MOCK_USERS[12] },
  { id: 'sc14', cycleId: 'cycle2026', userId: 'u14', downwardScore: null, peerScore: 4.0, upwardScore: 3.9, totalScore: 4.0, calibratedScore: null, isCalibrated: false, user: MOCK_USERS[13] },
]

// ──────────────────────────────────────────────
// IDP (이서연)
// ──────────────────────────────────────────────
export const MOCK_IDP: Idp = {
  id: 'idp1', cycleId: 'cycle2026', userId: 'u1',
  strengths: '빠른 실행력과 꼼꼼한 품질 관리, 동료와의 원활한 협업',
  improvements: '기술적 깊이와 아키텍처 설계 역량, 영어 커뮤니케이션',
  goals: [
    { id: 'g1', skill: '시스템 설계', action: '사내 아키텍처 스터디 참여 + 사이드 프로젝트 설계 주도', dueDate: '2026-06-30', status: 'IN_PROGRESS' },
    { id: 'g2', skill: '영어 커뮤니케이션', action: '주 2회 영어 회화 스터디 참여', dueDate: '2026-09-30', status: 'NOT_STARTED' },
    { id: 'g3', skill: '리더십', action: '사내 멘토링 프로그램 멘토 지원', dueDate: '2026-12-31', status: 'NOT_STARTED' },
  ],
}

// ──────────────────────────────────────────────
// 유틸: userId로 직원 조회
// ──────────────────────────────────────────────
export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id)
}

// 사용자가 작성해야 할 평가 목록 (미완료 포함)
export function getSurveysForSurveyor(surveyorId: string): Survey[] {
  return MOCK_SURVEYS.filter((s) => s.surveyorId === surveyorId && s.type !== 'SELF')
}

// 사용자가 받은 평가 (제출 완료)
export function getSurveysForTarget(targetId: string): Survey[] {
  return MOCK_SURVEYS.filter((s) => s.targetId === targetId && s.status === 'SUBMITTED' && s.type !== 'SELF')
}
