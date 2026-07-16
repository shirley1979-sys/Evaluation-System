import type {
  User, Team, EvalCycle, Question, Nomination,
  Survey, Score, Idp, IdpGoal
} from '@/types'

// ──────────────────────────────────────────────
// 팀
// ──────────────────────────────────────────────
export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Maker 1 Motion Insight', managerId: 'u2',  division: null },
  { id: 't2', name: 'Global Platform',         managerId: 'u7',  division: null },
  { id: 't3', name: 'Design Studio',           managerId: 'u11', division: null },
  { id: 't4', name: 'Data Intelligence',       managerId: 'u14', division: null },
  { id: 't5', name: 'TEST팀',                  managerId: 'u18', division: 'QA 테스트' },
]

// ──────────────────────────────────────────────
// 직원
// ──────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  // Maker 1 Motion Insight
  { id: 'u1',  name: '이서연', nameEng: 'Seoyeon', nickname: '서연',    email: 'seoyeon@everex.co.kr',  role: 'MEMBER',     teamId: 't1', team: MOCK_TEAMS[0], jobTitle: '주임',  jobDuty: '프론트엔드 개발자',    hireDate: '2021-03-02', leaveDate: null, ssnPrefix: '950312', managerEmail: 'minjun@everex.co.kr',  isActive: true },
  { id: 'u2',  name: '김민준', nameEng: 'Minjun',  nickname: '민준',    email: 'minjun@everex.co.kr',   role: 'MANAGER',    teamId: 't1', team: MOCK_TEAMS[0], jobTitle: '팀장',  jobDuty: '팀장',                hireDate: '2018-01-15', leaveDate: null, ssnPrefix: '880621', managerEmail: null,                   isActive: true },
  { id: 'u3',  name: '박지호', nameEng: 'Jiho',    nickname: '지호',    email: 'jiho@everex.co.kr',     role: 'MEMBER',     teamId: 't1', team: MOCK_TEAMS[0], jobTitle: '선임',  jobDuty: '백엔드 개발자',        hireDate: '2019-07-01', leaveDate: null, ssnPrefix: '910401', managerEmail: 'minjun@everex.co.kr',  isActive: true },
  { id: 'u4',  name: '최수아', nameEng: 'Sua',     nickname: '수아',    email: 'sua@everex.co.kr',      role: 'MEMBER',     teamId: 't1', team: MOCK_TEAMS[0], jobTitle: '주임',  jobDuty: 'QA 엔지니어',         hireDate: '2022-04-04', leaveDate: null, ssnPrefix: '960825', managerEmail: 'minjun@everex.co.kr',  isActive: true },
  { id: 'u5',  name: '정하은', nameEng: 'Haeun',   nickname: '하은',    email: 'haeun@everex.co.kr',    role: 'MEMBER',     teamId: 't1', team: MOCK_TEAMS[0], jobTitle: '사원',  jobDuty: '백엔드 개발자',        hireDate: '2023-02-20', leaveDate: null, ssnPrefix: '980711', managerEmail: 'minjun@everex.co.kr',  isActive: true },
  // Global Platform
  { id: 'u6',  name: '오준혁', nameEng: 'Junhyuk', nickname: '준혁',    email: 'junhyuk@everex.co.kr',  role: 'MEMBER',     teamId: 't2', team: MOCK_TEAMS[1], jobTitle: '선임',  jobDuty: '풀스택 개발자',        hireDate: '2020-06-01', leaveDate: null, ssnPrefix: '930215', managerEmail: 'yuri@everex.co.kr',    isActive: true },
  { id: 'u7',  name: '한유리', nameEng: 'Yuri',    nickname: '유리',    email: 'yuri@everex.co.kr',     role: 'MANAGER',    teamId: 't2', team: MOCK_TEAMS[1], jobTitle: '팀장',  jobDuty: '팀장',                hireDate: '2016-09-05', leaveDate: null, ssnPrefix: '850302', managerEmail: null,                   isActive: true },
  { id: 'u8',  name: '윤태양', nameEng: 'Taeyang', nickname: '태양',    email: 'taeyang@everex.co.kr',  role: 'MEMBER',     teamId: 't2', team: MOCK_TEAMS[1], jobTitle: '주임',  jobDuty: '데브옵스 엔지니어',    hireDate: '2021-11-15', leaveDate: null, ssnPrefix: '940603', managerEmail: 'yuri@everex.co.kr',    isActive: true },
  { id: 'u9',  name: '임나라', nameEng: 'Nara',    nickname: '나라',    email: 'nara@everex.co.kr',     role: 'MEMBER',     teamId: 't2', team: MOCK_TEAMS[1], jobTitle: '사원',  jobDuty: '프론트엔드 개발자',    hireDate: '2023-08-21', leaveDate: null, ssnPrefix: '990118', managerEmail: 'yuri@everex.co.kr',    isActive: true },
  // Design Studio
  { id: 'u10', name: '강다인', nameEng: 'Dain',    nickname: '다인',    email: 'dain@everex.co.kr',     role: 'MEMBER',     teamId: 't3', team: MOCK_TEAMS[2], jobTitle: '주임',  jobDuty: 'UX 디자이너',         hireDate: '2022-01-10', leaveDate: null, ssnPrefix: '961230', managerEmail: 'soyeon@everex.co.kr',  isActive: true },
  { id: 'u11', name: '신소연', nameEng: 'Soyeon',  nickname: '소연',    email: 'soyeon@everex.co.kr',   role: 'MANAGER',    teamId: 't3', team: MOCK_TEAMS[2], jobTitle: '팀장',  jobDuty: '팀장',                hireDate: '2017-04-03', leaveDate: null, ssnPrefix: '870914', managerEmail: null,                   isActive: true },
  { id: 'u12', name: '백승우', nameEng: 'Seungwoo',nickname: '승우',    email: 'seungwoo@everex.co.kr', role: 'MEMBER',     teamId: 't3', team: MOCK_TEAMS[2], jobTitle: '선임',  jobDuty: '프로덕트 디자이너',    hireDate: '2019-10-07', leaveDate: null, ssnPrefix: '920508', managerEmail: 'soyeon@everex.co.kr',  isActive: true },
  // Data Intelligence
  { id: 'u13', name: '류채원', nameEng: 'Chaewon', nickname: '채원',    email: 'chaewon@everex.co.kr',  role: 'MEMBER',     teamId: 't4', team: MOCK_TEAMS[3], jobTitle: '주임',  jobDuty: '데이터 사이언티스트',  hireDate: '2021-05-17', leaveDate: null, ssnPrefix: '950920', managerEmail: 'woosung@everex.co.kr', isActive: true },
  { id: 'u14', name: '문우성', nameEng: 'Woosung', nickname: '우성',    email: 'woosung@everex.co.kr',  role: 'MANAGER',    teamId: 't4', team: MOCK_TEAMS[3], jobTitle: '팀장',  jobDuty: '팀장',                hireDate: '2015-02-23', leaveDate: null, ssnPrefix: '830406', managerEmail: null,                   isActive: true },
  // HR / Admin
  { id: 'u15', name: 'Shirley',nameEng: 'Shirley', nickname: 'Shirley', email: 'shirley@everex.co.kr',  role: 'HR_ADMIN',   teamId: null, team: undefined,    jobTitle: 'HR팀장', jobDuty: 'HR 관리자',           hireDate: '2014-06-01', leaveDate: null, ssnPrefix: '820905', managerEmail: null,                   isActive: true },
  { id: 'u16', name: '관리자', nameEng: 'Admin',   nickname: 'Admin',   email: 'admin@everex.co.kr',    role: 'SUPER_ADMIN',teamId: null, team: undefined,    jobTitle: '관리자', jobDuty: '슈퍼관리자',           hireDate: '2010-01-01', leaveDate: null, ssnPrefix: '800101', managerEmail: null,                   isActive: true },
  // TEST팀 — 워크플로우 테스트용 (직원TEST가 팀장TEST를 상향평가, 팀장TEST가 직원TEST를 하향평가)
  { id: 'u17', name: '직원TEST', nameEng: 'MemberTest', nickname: '직원TEST', email: 'membertest@everex.co.kr', role: 'MEMBER',  teamId: 't5', team: MOCK_TEAMS[4], jobTitle: '사원', jobDuty: 'QA 테스트', hireDate: '2026-01-01', leaveDate: null, ssnPrefix: '000101', managerEmail: 'leadtest@everex.co.kr', isActive: true },
  { id: 'u18', name: '팀장TEST', nameEng: 'LeadTest',   nickname: '팀장TEST', email: 'leadtest@everex.co.kr',   role: 'MANAGER', teamId: 't5', team: MOCK_TEAMS[4], jobTitle: '팀장', jobDuty: 'QA 테스트 팀장', hireDate: '2025-01-01', leaveDate: null, ssnPrefix: '000102', managerEmail: null,                    isActive: true },
  { id: 'u19', name: '부문장TEST', nameEng: 'DivHeadTest', nickname: '부문장TEST', email: 'divheadtest@everex.co.kr', role: 'EXECUTIVE', teamId: null, team: undefined, jobTitle: '부문장', jobDuty: 'QA 테스트 부문장', hireDate: '2024-01-01', leaveDate: null, ssnPrefix: '000103', managerEmail: null, isActive: true },
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
// 평가 문항 (31개)
// ──────────────────────────────────────────────
export const MOCK_QUESTIONS: Question[] = [
  // 공통 (7)
  { id: 'c1', type: 'COMMON', category: '업무 성과', text: '담당 업무의 산출물이 목표한 품질과 기한을 충족하고 있다', description: '본인의 직무(개발, 기획, 디자인, 데이터, QA 등)에 따른 산출물(코드, 기획서, 디자인 시안, 분석 리포트, 테스트 결과 등)이 약속된 일정과 품질 기준(리뷰 통과, 재작업 최소화 등)을 실제로 충족했는지를 기준으로 평가하세요.', anchor1: '기한·품질 모두 미달', anchor3: '기한 준수, 품질 보통', anchor5: '기한 준수, 품질 탁월', order: 1, isActive: true },
  { id: 'c2', type: 'COMMON', category: '업무 성과', text: '맡은 업무의 범위와 복잡도에 비해 높은 생산성을 발휘한다', description: '단순히 시간을 많이 썼는지가 아니라, 업무의 난이도·범위 대비 처리한 양과 효율을 봅니다. 예: 제한된 리소스로 여러 프로젝트를 동시에 소화했는지, 반복 작업을 자동화·개선했는지 등.', anchor1: '기대 이하', anchor3: '기대 수준', anchor5: '기대 이상', order: 2, isActive: true },
  { id: 'c3', type: 'COMMON', category: '협업/소통', text: '동료와의 소통이 명확하고 협업에 긍정적인 영향을 준다', description: '직무가 다른 동료 간(개발-기획-디자인-데이터 등)에도 정보 전달이 정확했는지, 회의나 문서에서 요점을 명확히 전달해 오해나 재작업을 줄였는지를 살펴보세요.', anchor1: '소통 부족', anchor3: '보통', anchor5: '탁월한 소통', order: 3, isActive: true },
  { id: 'c4', type: 'COMMON', category: '협업/소통', text: '갈등 상황에서 건설적으로 문제를 해결하려고 노력한다', description: '일정 충돌, 우선순위 이견, 책임 소재 등 실제 갈등이 생겼을 때 감정적으로 대응하기보다 문제 해결에 집중했는지를 구체적 사례 중심으로 판단하세요.', anchor1: '회피/악화', anchor3: '보통', anchor5: '적극 해결', order: 4, isActive: true },
  { id: 'c5', type: 'COMMON', category: '성장/학습', text: '새로운 기술이나 방법을 빠르게 습득하고 업무에 적용한다', description: '새로운 툴, 기준, 업무 프로세스가 도입되었을 때 얼마나 빠르게 익히고 본인 직무의 실제 업무에 적용했는지를 평가합니다.', anchor1: '변화 거부', anchor3: '보통', anchor5: '선도적 학습', order: 5, isActive: true },
  { id: 'c6', type: 'COMMON', category: '성장/학습', text: '피드백을 열린 자세로 수용하고 개선하려는 모습을 보인다', description: '코드 리뷰, 기획 리뷰, 디자인 리뷰 등 직무별 리뷰 과정에서 받은 지적을 방어적으로 받아들이지 않고 실제 개선으로 이어갔는지를 기준으로 하세요.', anchor1: '방어적', anchor3: '보통', anchor5: '적극 수용', order: 6, isActive: true },
  { id: 'c7', type: 'COMMON', category: '주도성', text: '지시 없이도 필요한 일을 스스로 찾아 실행한다', description: '누가 시키지 않아도 문제나 개선 지점을 먼저 발견해 제안·실행했는지를 봅니다. 반복 업무를 그대로 따르기만 했다면 낮게, 프로세스 개선을 주도했다면 높게 평가하세요.', anchor1: '지시 의존', anchor3: '보통', anchor5: '완전 자기주도', order: 7, isActive: true },
  // 하향 (5) — 팀장이 팀원을 평가
  { id: 'm1', type: 'DOWNWARD', category: '리더십', text: '팀원의 성장을 위한 코칭과 피드백을 꾸준히 제공한다', description: '1:1 미팅이나 월별 피드백 등을 통해 구체적이고 실행 가능한 피드백을 정기적으로 제공했는지를 기준으로 평가하세요. 형식적인 통보가 아니라 성장에 실질적으로 도움이 되었는지가 핵심입니다.', anchor1: '피드백 없음', anchor3: '가끔 제공', anchor5: '정기적·효과적', order: 1, isActive: true },
  { id: 'm2', type: 'DOWNWARD', category: '리더십', text: '팀 목표를 명확히 설정하고 방향을 제시한다', description: '팀의 분기·연간 목표(제품 로드맵, 프로젝트 일정 등)를 팀원들이 이해하고 공감할 수 있게 명확히 전달했는지를 봅니다.', anchor1: '방향 부재', anchor3: '보통', anchor5: '명확한 비전', order: 2, isActive: true },
  { id: 'm3', type: 'DOWNWARD', category: '의사결정', text: '데이터와 논리를 근거로 합리적인 의사결정을 내린다', description: '제품 우선순위, 리소스 배분, 일정 조정 등의 의사결정 시 근거(데이터, 사용자 피드백, 리스크 분석 등)를 바탕으로 판단했는지를 평가하세요.', anchor1: '감에 의존', anchor3: '보통', anchor5: '체계적 결정', order: 3, isActive: true },
  { id: 'm4', type: 'DOWNWARD', category: '팀 운영', text: '팀원 각자의 강점을 파악하고 적절히 업무를 배분한다', description: '팀원의 역량과 관심사를 고려해 업무를 배분했는지, 특정 인원에게 부담이 쏠리지 않도록 조율했는지를 봅니다.', anchor1: '획일적 배분', anchor3: '보통', anchor5: '최적 배분', order: 4, isActive: true },
  { id: 'm5', type: 'DOWNWARD', category: '팀 운영', text: '어려움에 처한 팀원을 발견하고 지원을 아끼지 않는다', description: '업무 과부하, 번아웃 징후, 개인적 어려움 등을 먼저 알아채고 실질적으로 도움을 준 사례가 있었는지를 기준으로 하세요.', anchor1: '무관심', anchor3: '필요 시 지원', anchor5: '선제적 지원', order: 5, isActive: true },
  // 상향 (9) — 팀원이 팀장을 평가, 완전 익명
  { id: 'u1', type: 'UPWARD', category: '심리적 안전', text: '의견을 자유롭게 표현할 수 있는 환경을 만들어준다', description: '반대 의견이나 우려사항을 말했을 때 불이익 없이 자유롭게 표현할 수 있었는지를 솔직하게 평가하세요. 완전 익명으로 처리됩니다.', anchor1: '눈치 봄', anchor3: '보통', anchor5: '완전히 자유', order: 1, isActive: true },
  { id: 'u2', type: 'UPWARD', category: '심리적 안전', text: '팀원의 실수를 성장의 기회로 보고 비난하지 않는다', description: '업무 중 실수나 실패가 있었을 때 원인 파악과 재발 방지에 집중했는지, 개인을 비난하는 방식이었는지를 봅니다.', anchor1: '비난·비판', anchor3: '보통', anchor5: '성장 중심', order: 2, isActive: true },
  { id: 'u3', type: 'UPWARD', category: '지원', text: '필요한 자원과 정보를 적시에 제공한다', description: '업무에 필요한 예산, 인력, 정보, 의사결정 권한 등을 요청했을 때 시기적절하게 지원받았는지를 평가하세요.', anchor1: '정보 부족', anchor3: '보통', anchor5: '충분한 지원', order: 3, isActive: true },
  { id: 'u4', type: 'UPWARD', category: '공정성', text: '팀원을 공정하게 평가하고 기회를 균등하게 부여한다', description: '평가, 승진 추천, 주요 프로젝트 배정 등에서 특정 인원에게 편향되지 않고 공정한 기준이 적용되었는지를 봅니다.', anchor1: '편향됨', anchor3: '보통', anchor5: '매우 공정', order: 4, isActive: true },
  { id: 'u5', type: 'UPWARD', category: '커뮤니케이션', text: '팀과 조직의 방향을 투명하게 공유한다', description: '회사·부문의 주요 결정사항(조직개편, 사업 방향 등)을 팀원들에게 얼마나 투명하게, 시기적절하게 공유했는지를 평가하세요.', anchor1: '불투명', anchor3: '보통', anchor5: '완전 투명', order: 5, isActive: true },
  { id: 'u6', type: 'UPWARD', category: '리더십', text: '팀장으로서 명확한 방향성을 가지고 팀을 이끈다', description: '단순히 업무를 지시하는 것을 넘어, 팀이 나아갈 방향을 스스로 고민하고 구성원들이 따를 수 있는 리더십을 실제로 발휘했는지를 평가하세요.', anchor1: '리딩 부재', anchor3: '보통', anchor5: '강한 리더십', order: 6, isActive: true },
  { id: 'u7', type: 'UPWARD', category: '문제해결', text: '타 부서와의 갈등이나 이슈 발생 시 팀장이 적극적으로 나서서 해결한다', description: '협업 과정에서 다른 팀·부서와 의견 충돌이나 업무 이슈가 생겼을 때, 팀장이 문제를 회피하지 않고 직접 조율·해결에 나섰는지를 기준으로 평가하세요.', anchor1: '회피/방치', anchor3: '보통', anchor5: '적극 해결', order: 7, isActive: true },
  { id: 'u8', type: 'UPWARD', category: '문제해결', text: '팀 내부의 문제나 장애물을 신속하고 효과적으로 해결한다', description: '업무 진행 중 발생한 팀 내 갈등, 병목, 리소스 부족 등의 문제를 팀장이 얼마나 빠르고 효과적으로 해결했는지를 평가하세요.', anchor1: '해결 지연/방치', anchor3: '보통', anchor5: '신속·효과적 해결', order: 8, isActive: true },
  { id: 'u9', type: 'UPWARD', category: '팀 운영', text: '팀원에게 부족한 역량이나 업무를 팀장이 직접 보완해준다', description: '팀원 개인이 감당하기 어려운 역량 공백이나 업무 과부하가 있을 때, 팀장이 직접 나서서 채워주거나 실질적인 도움을 주었는지를 기준으로 평가하세요.', anchor1: '방치', anchor3: '보통', anchor5: '적극 보완', order: 9, isActive: true },
  // 동료 (5) — 익명, 응답자 2명 이상 시 코멘트 공개
  { id: 'p1', type: 'PEER', category: '신뢰', text: '약속한 것을 기한 내에 완수하여 신뢰를 쌓는다', description: '함께 작업하며 합의한 마감일이나 담당 범위를 실제로 지켰는지, 지키지 못할 경우 사전에 알렸는지를 기준으로 평가하세요.', anchor1: '자주 미이행', anchor3: '보통', anchor5: '항상 이행', order: 1, isActive: true },
  { id: 'p2', type: 'PEER', category: '신뢰', text: '어려운 상황에서도 팀을 위해 책임을 다한다', description: '일정이 촉박하거나 문제가 발생했을 때 회피하지 않고 끝까지 책임지는 모습을 보였는지를 봅니다.', anchor1: '회피', anchor3: '보통', anchor5: '책임 완수', order: 2, isActive: true },
  { id: 'p3', type: 'PEER', category: '기여', text: '팀의 공동 목표 달성에 적극적으로 기여한다', description: '개인 성과뿐 아니라 팀 전체 목표(출시 일정, 품질 지표 등)를 위해 자신의 역할 이상으로 기여했는지를 평가하세요.', anchor1: '개인 중심', anchor3: '보통', anchor5: '팀 최우선', order: 3, isActive: true },
  { id: 'p4', type: 'PEER', category: '기여', text: '업무 외 시간에도 동료를 기꺼이 돕는다', description: '본인 업무가 아니어도 동료가 어려움을 겪을 때 자발적으로 도움을 준 경험이 있었는지를 기준으로 하세요.', anchor1: '비협조적', anchor3: '요청 시 도움', anchor5: '자발적 지원', order: 4, isActive: true },
  { id: 'p5', type: 'PEER', category: '전문성 공유', text: '본인의 전문 지식을 팀과 적극적으로 공유한다', description: '개발 노하우, 임상·규제 지식, 기획 인사이트 등 본인만 아는 정보를 문서화하거나 공유해 팀 전체의 역량을 높였는지를 봅니다.', anchor1: '공유 없음', anchor3: '요청 시 공유', anchor5: '자발적 공유', order: 5, isActive: true },
  // 셀프 (5)
  { id: 's1', type: 'SELF', category: '자기 인식', text: '나의 강점과 약점을 명확히 파악하고 있다', description: '올해 업무를 돌아봤을 때, 본인이 잘하는 부분과 부족한 부분을 구체적인 사례를 들어 설명할 수 있는 정도를 스스로 평가하세요.', anchor1: '인식 부족', anchor3: '보통', anchor5: '매우 명확', order: 1, isActive: true },
  { id: 's2', type: 'SELF', category: '자기 인식', text: '일과 삶의 균형을 적절히 유지하고 있다', description: '지속 가능한 페이스로 일하고 있는지, 번아웃 없이 올해를 보냈는지를 솔직하게 돌아보세요.', anchor1: '심각한 불균형', anchor3: '보통', anchor5: '잘 유지', order: 2, isActive: true },
  { id: 's3', type: 'SELF', category: '목표 관리', text: '분기 목표를 구체적으로 설정하고 실행한다', description: '연초·분기 초에 세운 목표가 얼마나 구체적이었고, 실제로 어느 정도까지 실행에 옮겼는지를 평가하세요.', anchor1: '목표 없음', anchor3: '보통', anchor5: '체계적 관리', order: 3, isActive: true },
  { id: 's4', type: 'SELF', category: '목표 관리', text: '업무 우선순위를 효과적으로 관리한다', description: '여러 프로젝트나 요청이 겹쳤을 때 무엇을 먼저 처리할지 스스로 판단하고 조율할 수 있었는지를 봅니다.', anchor1: '우선순위 혼란', anchor3: '보통', anchor5: '완벽한 관리', order: 4, isActive: true },
  { id: 's5', type: 'SELF', category: '성장', text: '올해 목표했던 역량 개발을 충분히 이루었다', description: '연초에 계획했던 학습·역량 개발 목표(신규 기술 습득, 자격, 프로젝트 경험 등)를 실제로 얼마나 달성했는지 돌아보세요.', anchor1: '거의 없음', anchor3: '보통', anchor5: '완전 달성', order: 5, isActive: true },
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
  // TEST팀 워크플로우 테스트: 직원TEST → 팀장TEST 상향평가 (미작성)
  {
    id: 'sv9', cycleId: 'cycle2026', surveyorId: 'u17', targetId: 'u18', type: 'UPWARD',
    status: 'DRAFT', submittedAt: null,
    comment: '', answers: [],
    target: MOCK_USERS[17], surveyor: MOCK_USERS[16],
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
