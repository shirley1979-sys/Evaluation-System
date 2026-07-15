-- EverEx 다면평가 시스템 — 전체 데이터 모델
-- 실행 대상: dgapysdrjtgmiocbuhra (everex-evaluation)

create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────
-- ENUM
-- ──────────────────────────────────────────────
create type role_t          as enum ('MEMBER','MANAGER','EXECUTIVE','HR_ADMIN','SUPER_ADMIN');
create type eval_type_t     as enum ('DOWNWARD','UPWARD','PEER','SELF');
create type question_type_t as enum ('COMMON','DOWNWARD','UPWARD','PEER','SELF','TEXT');
create type cycle_phase_t   as enum ('SETUP','NOMINATION','HR_CONFIRM','EVALUATION','CLOSED','RESULTS_OPEN');
create type nomination_status_t as enum ('PENDING','SUBMITTED','HR_CONFIRMED');
create type nomination_group_t  as enum ('TEAMMATE','COLLAB');
create type survey_status_t as enum ('DRAFT','SUBMITTED');
create type idp_goal_status_t as enum ('NOT_STARTED','IN_PROGRESS','COMPLETED');
create type grade_t as enum ('S','A','B+','B','C+','C','D');
create type apply_mode_t as enum ('IMMEDIATE','NEXT_CYCLE');

-- ──────────────────────────────────────────────
-- 조직: 팀 / 프로필
-- ──────────────────────────────────────────────
create table teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  division    text,                 -- 부문 (예: 개발부문)
  manager_id  uuid,                  -- fk 아래에서 profiles 생성 후 추가
  created_at  timestamptz not null default now()
);

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  name_eng      text,
  nickname      text,
  email         text not null unique,
  role          role_t not null default 'MEMBER',
  team_id       uuid references teams(id) on delete set null,
  job_title     text,               -- 직책
  job_duty      text,               -- 직무
  hire_date     date,
  leave_date    date,
  manager_email text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table teams add constraint teams_manager_fk
  foreign key (manager_id) references profiles(id) on delete set null;

create index idx_profiles_team on profiles(team_id);
create index idx_profiles_role on profiles(role);

-- 팀장 공석 대행 지정
create table acting_evaluators (
  team_id       uuid primary key references teams(id) on delete cascade,
  acting_id     uuid references profiles(id) on delete set null,
  updated_at    timestamptz not null default now()
);

-- 개발팀 등 교차기능 평가자(담당 PM) 지정
create table cross_evaluator_assignments (
  user_id       uuid primary key references profiles(id) on delete cascade,
  evaluator_id  uuid references profiles(id) on delete set null,
  role_label    text,               -- 예: '담당 PM'
  updated_at    timestamptz not null default now()
);

-- 조직 이동 이력
create table org_move_history (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  from_team_id  uuid references teams(id),
  to_team_id    uuid references teams(id),
  apply_mode    apply_mode_t not null default 'IMMEDIATE',
  deferred_eval boolean not null default false,   -- 재직 3개월 미만 등 평가 유보
  note          text,
  processed_by  uuid references profiles(id),
  created_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 평가 사이클 / 가중치 설정
-- ──────────────────────────────────────────────
create table eval_cycles (
  id                  uuid primary key default gen_random_uuid(),
  year                int not null,
  phase               cycle_phase_t not null default 'SETUP',
  nomination_open_at  timestamptz,
  nomination_close_at timestamptz,
  eval_open_at        timestamptz,
  eval_close_at       timestamptz,
  result_open_at      timestamptz,
  created_at          timestamptz not null default now(),
  unique(year)
);

-- 1차/2차, 팀장평가(부문장/CEO) 가중치 — 싱글톤(운영상 1행만 사용)
create table eval_weight_settings (
  id                    boolean primary key default true check (id),
  member_primary_pct    int not null default 70,   -- 팀원: 1차(팀장)
  member_secondary_pct  int not null default 30,   -- 팀원: 2차(부문장/실장)
  manager_division_pct  int not null default 70,   -- 팀장: 부문장/실장
  manager_ceo_pct       int not null default 30,   -- 팀장: 대표이사
  confirmed_at          timestamptz,
  confirmed_by          uuid references profiles(id),
  updated_at            timestamptz not null default now()
);
insert into eval_weight_settings (id) values (true);

create table grade_bands (
  grade     grade_t primary key,
  min_score numeric(3,2) not null
);
insert into grade_bands (grade, min_score) values
  ('S', 4.60), ('A', 4.20), ('B+', 3.70), ('B', 3.00), ('C+', 2.50), ('C', 1.80), ('D', 0.00);

-- ──────────────────────────────────────────────
-- 평가 문항
-- ──────────────────────────────────────────────
create table questions (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  description text,
  type        question_type_t not null,
  category    text not null,
  anchor1     text,
  anchor3     text,
  anchor5     text,
  "order"     int not null default 0,
  is_active   boolean not null default true
);

-- ──────────────────────────────────────────────
-- 동료 추천
-- ──────────────────────────────────────────────
create table nomination_entries (
  id            uuid primary key default gen_random_uuid(),
  cycle_id      uuid not null references eval_cycles(id) on delete cascade,
  nominator_id  uuid not null references profiles(id) on delete cascade,
  status        nomination_status_t not null default 'PENDING',
  hr_modified   boolean not null default false,
  confirmed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique(cycle_id, nominator_id)
);

create table nomination_items (
  id        uuid primary key default gen_random_uuid(),
  entry_id  uuid not null references nomination_entries(id) on delete cascade,
  nominee_id uuid not null references profiles(id) on delete cascade,
  group_type nomination_group_t not null
);

-- ──────────────────────────────────────────────
-- 설문(하향/상향/동료) + 응답
-- ──────────────────────────────────────────────
create table surveys (
  id            uuid primary key default gen_random_uuid(),
  cycle_id      uuid not null references eval_cycles(id) on delete cascade,
  surveyor_id   uuid not null references profiles(id) on delete cascade,
  target_id     uuid not null references profiles(id) on delete cascade,
  type          eval_type_t not null,
  status        survey_status_t not null default 'DRAFT',
  comment       text,
  submitted_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique(cycle_id, surveyor_id, target_id, type)
);

create table survey_answers (
  id          uuid primary key default gen_random_uuid(),
  survey_id   uuid not null references surveys(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  score       int not null check (score between 1 and 5),
  unique(survey_id, question_id)
);

-- ──────────────────────────────────────────────
-- 팀장 하향/상향 서술형 리뷰 (기존 managerReview 스토어)
-- ──────────────────────────────────────────────
create table manager_reviews (
  id                  uuid primary key default gen_random_uuid(),
  cycle_id            uuid not null references eval_cycles(id) on delete cascade,
  manager_id          uuid not null references profiles(id) on delete cascade,
  target_id           uuid not null references profiles(id) on delete cascade,
  performance_score   int check (performance_score between 1 and 5),
  competency_score    int check (competency_score between 1 and 5),
  collaboration_score int check (collaboration_score between 1 and 5),
  performance         text,
  competency          text,
  collaboration       text,
  overall             text,
  submitted           boolean not null default false,
  saved_at            timestamptz,
  unique(cycle_id, manager_id, target_id)
);

-- ──────────────────────────────────────────────
-- 셀프 평가 (프로젝트별 + 증빙 링크)
-- ──────────────────────────────────────────────
create table self_eval_entries (
  id            uuid primary key default gen_random_uuid(),
  cycle_id      uuid not null references eval_cycles(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  strengths     text default '',
  improvements  text default '',
  status        survey_status_t not null default 'DRAFT',
  updated_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  unique(cycle_id, user_id)
);

create table self_eval_projects (
  id            uuid primary key default gen_random_uuid(),
  entry_id      uuid not null references self_eval_entries(id) on delete cascade,
  name          text default '',
  role          text default '',
  deliverable   text default '',
  good_points   text default '',
  improvements  text default '',
  requests      text default '',
  "order"       int not null default 0
);

create table evidence_links (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references self_eval_projects(id) on delete cascade,
  label       text not null,
  url         text not null,
  created_at  timestamptz not null default now()
);

create table self_eval_scores (
  entry_id    uuid not null references self_eval_entries(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  score       int not null check (score between 1 and 5),
  primary key (entry_id, question_id)
);

create table self_eval_text_answers (
  entry_id    uuid not null references self_eval_entries(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  answer      text not null default '',
  primary key (entry_id, question_id)
);

-- ──────────────────────────────────────────────
-- 종합 점수 / 캘리브레이션 / 상반기 / 최종확정
-- ──────────────────────────────────────────────
create table scores (
  id                uuid primary key default gen_random_uuid(),
  cycle_id          uuid not null references eval_cycles(id) on delete cascade,
  user_id           uuid not null references profiles(id) on delete cascade,
  downward_score    numeric(3,2),
  peer_score        numeric(3,2),
  upward_score      numeric(3,2),
  total_score       numeric(3,2),
  calibrated_score  numeric(3,2),
  is_calibrated     boolean not null default false,
  unique(cycle_id, user_id)
);

create table mid_year_reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  cycle_year  int not null,
  comment     text default '',
  grade       grade_t,                 -- S 제외 (앱 레벨 + check로 강제)
  written_by  uuid references profiles(id),
  written_at  timestamptz,
  updated_at  timestamptz not null default now(),
  unique(user_id, cycle_year),
  constraint mid_year_no_s check (grade is null or grade <> 'S')
);

create table final_grades (
  id            uuid primary key default gen_random_uuid(),
  cycle_id      uuid not null references eval_cycles(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  computed_grade grade_t,
  final_grade   grade_t,
  confirmed_by  uuid references profiles(id),
  confirmed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique(cycle_id, user_id)
);

-- ──────────────────────────────────────────────
-- IDP
-- ──────────────────────────────────────────────
create table idp (
  id            uuid primary key default gen_random_uuid(),
  cycle_id      uuid not null references eval_cycles(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  strengths     text default '',
  improvements  text default '',
  unique(cycle_id, user_id)
);

create table idp_goals (
  id        uuid primary key default gen_random_uuid(),
  idp_id    uuid not null references idp(id) on delete cascade,
  skill     text not null,
  action    text not null,
  due_date  date,
  status    idp_goal_status_t not null default 'NOT_STARTED'
);
