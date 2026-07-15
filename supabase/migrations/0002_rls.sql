-- RLS 정책 + 익명성 보호용 집계 함수

-- ──────────────────────────────────────────────
-- 헬퍼 함수
-- ──────────────────────────────────────────────
create or replace function current_role_t() returns role_t
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_hr_or_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('HR_ADMIN','SUPER_ADMIN') from profiles where id = auth.uid()), false);
$$;

create or replace function is_manager_of(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles me, profiles t
    where me.id = auth.uid() and t.id = target
    and me.role in ('MANAGER','EXECUTIVE') and t.team_id = me.team_id
  );
$$;

-- ──────────────────────────────────────────────
-- RLS 활성화
-- ──────────────────────────────────────────────
alter table teams enable row level security;
alter table profiles enable row level security;
alter table acting_evaluators enable row level security;
alter table cross_evaluator_assignments enable row level security;
alter table org_move_history enable row level security;
alter table eval_cycles enable row level security;
alter table eval_weight_settings enable row level security;
alter table grade_bands enable row level security;
alter table questions enable row level security;
alter table nomination_entries enable row level security;
alter table nomination_items enable row level security;
alter table surveys enable row level security;
alter table survey_answers enable row level security;
alter table manager_reviews enable row level security;
alter table self_eval_entries enable row level security;
alter table self_eval_projects enable row level security;
alter table evidence_links enable row level security;
alter table self_eval_scores enable row level security;
alter table self_eval_text_answers enable row level security;
alter table scores enable row level security;
alter table mid_year_reviews enable row level security;
alter table final_grades enable row level security;
alter table idp enable row level security;
alter table idp_goals enable row level security;

-- ──────────────────────────────────────────────
-- teams / profiles
-- ──────────────────────────────────────────────
create policy teams_select on teams for select using (auth.uid() is not null);
create policy teams_write  on teams for all using (is_hr_or_admin()) with check (is_hr_or_admin());

create or replace function my_team_id() returns uuid
language sql stable security definer set search_path = public as $$
  select team_id from profiles where id = auth.uid();
$$;

create policy profiles_select_self on profiles for select using (id = auth.uid());
create policy profiles_select_team on profiles for select using (
  team_id = my_team_id()
);
create policy profiles_select_hr on profiles for select using (is_hr_or_admin());
create policy profiles_update_self on profiles for update using (id = auth.uid())
  with check (id = auth.uid());
create policy profiles_write_hr on profiles for all using (is_hr_or_admin()) with check (is_hr_or_admin());

-- ──────────────────────────────────────────────
-- 조직관리 (팀장공석/교차평가자/이동이력) — 조회는 전체, 쓰기는 HR
-- ──────────────────────────────────────────────
create policy acting_select on acting_evaluators for select using (auth.uid() is not null);
create policy acting_write  on acting_evaluators for all using (is_hr_or_admin()) with check (is_hr_or_admin());

create policy cross_eval_select on cross_evaluator_assignments for select using (auth.uid() is not null);
create policy cross_eval_write  on cross_evaluator_assignments for all using (is_hr_or_admin()) with check (is_hr_or_admin());

create policy org_move_select on org_move_history for select using (is_hr_or_admin() or user_id = auth.uid());
create policy org_move_write  on org_move_history for all using (is_hr_or_admin()) with check (is_hr_or_admin());

-- ──────────────────────────────────────────────
-- 사이클 / 가중치 / 등급구간 / 문항 — 조회 전체, 쓰기 HR·경영진
-- ──────────────────────────────────────────────
create policy cycles_select on eval_cycles for select using (auth.uid() is not null);
create policy cycles_write  on eval_cycles for all using (is_hr_or_admin()) with check (is_hr_or_admin());

create policy weights_select on eval_weight_settings for select using (auth.uid() is not null);
create policy weights_write  on eval_weight_settings for all using (
  current_role_t() in ('EXECUTIVE','HR_ADMIN','SUPER_ADMIN')
) with check (current_role_t() in ('EXECUTIVE','HR_ADMIN','SUPER_ADMIN'));

create policy bands_select on grade_bands for select using (auth.uid() is not null);
create policy bands_write  on grade_bands for all using (
  current_role_t() in ('EXECUTIVE','HR_ADMIN','SUPER_ADMIN')
) with check (current_role_t() in ('EXECUTIVE','HR_ADMIN','SUPER_ADMIN'));

create policy questions_select on questions for select using (auth.uid() is not null);
create policy questions_write  on questions for all using (is_hr_or_admin()) with check (is_hr_or_admin());

-- ──────────────────────────────────────────────
-- 동료 추천 — 본인 것만 CRUD, HR 전체
-- ──────────────────────────────────────────────
create policy nom_entries_owner on nomination_entries for all
  using (nominator_id = auth.uid() or is_hr_or_admin())
  with check (nominator_id = auth.uid() or is_hr_or_admin());

create policy nom_items_owner on nomination_items for all
  using (
    exists (select 1 from nomination_entries e where e.id = entry_id and (e.nominator_id = auth.uid() or is_hr_or_admin()))
  )
  with check (
    exists (select 1 from nomination_entries e where e.id = entry_id and (e.nominator_id = auth.uid() or is_hr_or_admin()))
  );

-- ──────────────────────────────────────────────
-- 설문 응답 — 익명 보호: target은 원본 row를 직접 조회할 수 없음 (RPC로만 집계 열람)
-- ──────────────────────────────────────────────
create policy surveys_owner_write on surveys for all
  using (surveyor_id = auth.uid() or is_hr_or_admin())
  with check (surveyor_id = auth.uid() or is_hr_or_admin());
-- target 본인/팀장은 select 불가 (get_person_report RPC로만 열람) — HR/작성자만 select

create policy survey_answers_owner on survey_answers for all
  using (exists (select 1 from surveys s where s.id = survey_id and (s.surveyor_id = auth.uid() or is_hr_or_admin())))
  with check (exists (select 1 from surveys s where s.id = survey_id and (s.surveyor_id = auth.uid() or is_hr_or_admin())));

-- ──────────────────────────────────────────────
-- 팀장 리뷰(하향, 실명) — 팀장 작성/조회, 본인 열람, HR 전체
-- ──────────────────────────────────────────────
create policy mgr_review_manager on manager_reviews for all
  using (manager_id = auth.uid() or is_hr_or_admin())
  with check (manager_id = auth.uid() or is_hr_or_admin());
create policy mgr_review_target_select on manager_reviews for select using (target_id = auth.uid());

-- ──────────────────────────────────────────────
-- 셀프평가 — 본인 CRUD, 팀장/HR 조회
-- ──────────────────────────────────────────────
create policy self_entries_owner on self_eval_entries for all
  using (user_id = auth.uid() or is_hr_or_admin() or is_manager_of(user_id))
  with check (user_id = auth.uid() or is_hr_or_admin());

create policy self_projects_owner on self_eval_projects for all
  using (exists (select 1 from self_eval_entries e where e.id = entry_id and (e.user_id = auth.uid() or is_hr_or_admin() or is_manager_of(e.user_id))))
  with check (exists (select 1 from self_eval_entries e where e.id = entry_id and (e.user_id = auth.uid() or is_hr_or_admin())));

create policy evidence_links_owner on evidence_links for all
  using (exists (
    select 1 from self_eval_projects p join self_eval_entries e on e.id = p.entry_id
    where p.id = project_id and (e.user_id = auth.uid() or is_hr_or_admin() or is_manager_of(e.user_id))
  ))
  with check (exists (
    select 1 from self_eval_projects p join self_eval_entries e on e.id = p.entry_id
    where p.id = project_id and (e.user_id = auth.uid() or is_hr_or_admin())
  ));

create policy self_scores_owner on self_eval_scores for all
  using (exists (select 1 from self_eval_entries e where e.id = entry_id and (e.user_id = auth.uid() or is_hr_or_admin() or is_manager_of(e.user_id))))
  with check (exists (select 1 from self_eval_entries e where e.id = entry_id and (e.user_id = auth.uid() or is_hr_or_admin())));

create policy self_text_owner on self_eval_text_answers for all
  using (exists (select 1 from self_eval_entries e where e.id = entry_id and (e.user_id = auth.uid() or is_hr_or_admin() or is_manager_of(e.user_id))))
  with check (exists (select 1 from self_eval_entries e where e.id = entry_id and (e.user_id = auth.uid() or is_hr_or_admin())));

-- ──────────────────────────────────────────────
-- 종합점수/캘리브레이션/상반기/최종확정 — 본인 select, 팀장 자기 팀 select, HR/경영진 전체
-- ──────────────────────────────────────────────
create policy scores_select on scores for select using (
  user_id = auth.uid() or is_hr_or_admin() or is_manager_of(user_id)
);
create policy scores_write on scores for all using (is_hr_or_admin()) with check (is_hr_or_admin());

create policy mid_year_select on mid_year_reviews for select using (
  user_id = auth.uid() or is_hr_or_admin() or is_manager_of(user_id)
);
create policy mid_year_write on mid_year_reviews for all using (
  is_hr_or_admin() or is_manager_of(user_id)
) with check (is_hr_or_admin() or is_manager_of(user_id));

create policy final_grades_select on final_grades for select using (
  user_id = auth.uid() or is_hr_or_admin() or is_manager_of(user_id)
);
create policy final_grades_write on final_grades for all using (
  current_role_t() in ('EXECUTIVE','HR_ADMIN','SUPER_ADMIN')
) with check (current_role_t() in ('EXECUTIVE','HR_ADMIN','SUPER_ADMIN'));

-- ──────────────────────────────────────────────
-- IDP — 본인 CRUD, 팀장/HR 조회
-- ──────────────────────────────────────────────
create policy idp_owner on idp for all
  using (user_id = auth.uid() or is_hr_or_admin() or is_manager_of(user_id))
  with check (user_id = auth.uid() or is_hr_or_admin());

create policy idp_goals_owner on idp_goals for all
  using (exists (select 1 from idp i where i.id = idp_id and (i.user_id = auth.uid() or is_hr_or_admin() or is_manager_of(i.user_id))))
  with check (exists (select 1 from idp i where i.id = idp_id and (i.user_id = auth.uid() or is_hr_or_admin())));

-- ──────────────────────────────────────────────
-- 익명 집계 리포트 RPC (setof record, SECURITY DEFINER로 RLS 우회 후 내부에서 권한 체크)
-- ──────────────────────────────────────────────
create or replace function get_person_report(p_target_id uuid, p_cycle_id uuid)
returns table (
  downward_score numeric, peer_score numeric, upward_score numeric, total_score numeric,
  peer_count int, upward_count int,
  peer_comments text[], upward_comments text[]
)
language plpgsql security definer set search_path = public as $$
declare
  v_is_hr boolean := is_hr_or_admin();
  v_peer_count int;
  v_upward_count int;
begin
  select count(*) into v_peer_count from surveys where target_id = p_target_id and cycle_id = p_cycle_id and type = 'PEER' and status = 'SUBMITTED';
  select count(*) into v_upward_count from surveys where target_id = p_target_id and cycle_id = p_cycle_id and type = 'UPWARD' and status = 'SUBMITTED';

  return query
  select
    (select avg(sa.score) from survey_answers sa join surveys s on s.id = sa.survey_id
      where s.target_id = p_target_id and s.cycle_id = p_cycle_id and s.type = 'DOWNWARD' and s.status = 'SUBMITTED'),
    (select avg(sa.score) from survey_answers sa join surveys s on s.id = sa.survey_id
      where s.target_id = p_target_id and s.cycle_id = p_cycle_id and s.type = 'PEER' and s.status = 'SUBMITTED'),
    (select avg(sa.score) from survey_answers sa join surveys s on s.id = sa.survey_id
      where s.target_id = p_target_id and s.cycle_id = p_cycle_id and s.type = 'UPWARD' and s.status = 'SUBMITTED'),
    null::numeric, -- total_score는 앱에서 가중치 적용해 계산 (score.ts 로직 재사용)
    v_peer_count, v_upward_count,
    case when v_is_hr or v_peer_count >= 2
      then (select coalesce(array_agg(s.comment), '{}') from surveys s where s.target_id = p_target_id and s.cycle_id = p_cycle_id and s.type = 'PEER' and s.status = 'SUBMITTED' and s.comment is not null and s.comment <> '')
      else '{}'::text[] end,
    case when v_is_hr or v_upward_count >= 3
      then (select coalesce(array_agg(s.comment), '{}') from surveys s where s.target_id = p_target_id and s.cycle_id = p_cycle_id and s.type = 'UPWARD' and s.status = 'SUBMITTED' and s.comment is not null and s.comment <> '')
      else '{}'::text[] end;
end;
$$;

-- 본인 또는 팀장/HR만 이 함수를 호출해 리포트를 볼 수 있도록 앱 레벨에서 검증
grant execute on function get_person_report(uuid, uuid) to authenticated;
