// supabase/migrations 스키마 기준 수기 작성 (Docker 없이 CLI 자동생성 불가 — docker 설치 후 `supabase gen types typescript --db-url ... `로 교체 가능)

export type RoleT = 'MEMBER' | 'MANAGER' | 'EXECUTIVE' | 'HR_ADMIN' | 'SUPER_ADMIN'
export type EvalTypeT = 'DOWNWARD' | 'UPWARD' | 'PEER' | 'SELF'
export type QuestionTypeT = 'COMMON' | 'DOWNWARD' | 'UPWARD' | 'PEER' | 'SELF' | 'TEXT'
export type CyclePhaseT = 'SETUP' | 'NOMINATION' | 'HR_CONFIRM' | 'EVALUATION' | 'CLOSED' | 'RESULTS_OPEN'
export type NominationStatusT = 'PENDING' | 'SUBMITTED' | 'CONFIRMED'
export type NominationGroupT = 'TEAMMATE' | 'COLLAB'
export type SurveyStatusT = 'DRAFT' | 'SUBMITTED'
export type IdpGoalStatusT = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
export type GradeT = 'S' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D'
export type ApplyModeT = 'IMMEDIATE' | 'NEXT_CYCLE'

interface Table<Row, Insert, Update = Partial<Insert>> {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      teams: Table<
        { id: string; name: string; division: string | null; manager_id: string | null; created_at: string },
        { id?: string; name: string; division?: string | null; manager_id?: string | null }
      >
      profiles: Table<
        {
          id: string; name: string; name_eng: string | null; nickname: string | null; email: string
          role: RoleT; team_id: string | null; job_title: string | null; job_duty: string | null
          hire_date: string | null; leave_date: string | null; manager_email: string | null
          is_active: boolean; created_at: string
        },
        {
          id: string; name: string; name_eng?: string | null; nickname?: string | null; email: string
          role?: RoleT; team_id?: string | null; job_title?: string | null; job_duty?: string | null
          hire_date?: string | null; leave_date?: string | null; manager_email?: string | null
          is_active?: boolean
        }
      >
      acting_evaluators: Table<
        { team_id: string; acting_id: string | null; updated_at: string },
        { team_id: string; acting_id?: string | null }
      >
      cross_evaluator_assignments: Table<
        { user_id: string; evaluator_id: string | null; role_label: string | null; updated_at: string },
        { user_id: string; evaluator_id?: string | null; role_label?: string | null }
      >
      org_move_history: Table<
        {
          id: string; user_id: string; from_team_id: string | null; to_team_id: string | null
          apply_mode: ApplyModeT; deferred_eval: boolean; note: string | null
          processed_by: string | null; created_at: string
        },
        {
          id?: string; user_id: string; from_team_id?: string | null; to_team_id?: string | null
          apply_mode?: ApplyModeT; deferred_eval?: boolean; note?: string | null; processed_by?: string | null
        }
      >
      eval_cycles: Table<
        {
          id: string; year: number; phase: CyclePhaseT
          nomination_open_at: string | null; nomination_close_at: string | null
          eval_open_at: string | null; eval_close_at: string | null; result_open_at: string | null
          created_at: string
        },
        {
          id?: string; year: number; phase?: CyclePhaseT
          nomination_open_at?: string | null; nomination_close_at?: string | null
          eval_open_at?: string | null; eval_close_at?: string | null; result_open_at?: string | null
        }
      >
      eval_weight_settings: Table<
        {
          id: true; member_primary_pct: number; member_secondary_pct: number
          manager_division_pct: number; manager_ceo_pct: number
          confirmed_at: string | null; confirmed_by: string | null; updated_at: string
        },
        {
          member_primary_pct?: number; member_secondary_pct?: number
          manager_division_pct?: number; manager_ceo_pct?: number
          confirmed_at?: string | null; confirmed_by?: string | null
        }
      >
      grade_bands: Table<
        { grade: GradeT; min_score: number },
        { grade: GradeT; min_score: number }
      >
      questions: Table<
        {
          id: string; text: string; description: string | null; type: QuestionTypeT; category: string
          anchor1: string | null; anchor3: string | null; anchor5: string | null
          order: number; is_active: boolean
        },
        {
          id?: string; text: string; description?: string | null; type: QuestionTypeT; category: string
          anchor1?: string | null; anchor3?: string | null; anchor5?: string | null
          order?: number; is_active?: boolean
        }
      >
      nomination_entries: Table<
        {
          id: string; cycle_id: string; nominator_id: string; status: NominationStatusT
          hr_modified: boolean; confirmed_at: string | null; updated_at: string
        },
        {
          id?: string; cycle_id: string; nominator_id: string; status?: NominationStatusT
          hr_modified?: boolean; confirmed_at?: string | null
        }
      >
      nomination_items: Table<
        { id: string; entry_id: string; nominee_id: string; group_type: NominationGroupT },
        { id?: string; entry_id: string; nominee_id: string; group_type: NominationGroupT }
      >
      surveys: Table<
        {
          id: string; cycle_id: string; surveyor_id: string; target_id: string; type: EvalTypeT
          status: SurveyStatusT; comment: string | null; submitted_at: string | null; updated_at: string
        },
        {
          id?: string; cycle_id: string; surveyor_id: string; target_id: string; type: EvalTypeT
          status?: SurveyStatusT; comment?: string | null; submitted_at?: string | null
        }
      >
      survey_answers: Table<
        { id: string; survey_id: string; question_id: string; score: number },
        { id?: string; survey_id: string; question_id: string; score: number }
      >
      manager_reviews: Table<
        {
          id: string; cycle_id: string; manager_id: string; target_id: string
          performance_score: number | null; competency_score: number | null; collaboration_score: number | null
          performance: string | null; competency: string | null; collaboration: string | null; overall: string | null
          submitted: boolean; saved_at: string | null
        },
        {
          id?: string; cycle_id: string; manager_id: string; target_id: string
          performance_score?: number | null; competency_score?: number | null; collaboration_score?: number | null
          performance?: string | null; competency?: string | null; collaboration?: string | null; overall?: string | null
          submitted?: boolean; saved_at?: string | null
        }
      >
      self_eval_entries: Table<
        {
          id: string; cycle_id: string; user_id: string; strengths: string; improvements: string
          status: SurveyStatusT; updated_at: string; submitted_at: string | null
        },
        {
          id?: string; cycle_id: string; user_id: string; strengths?: string; improvements?: string
          status?: SurveyStatusT; submitted_at?: string | null
        }
      >
      self_eval_projects: Table<
        {
          id: string; entry_id: string; name: string; role: string; deliverable: string
          good_points: string; improvements: string; requests: string; order: number
        },
        {
          id?: string; entry_id: string; name?: string; role?: string; deliverable?: string
          good_points?: string; improvements?: string; requests?: string; order?: number
        }
      >
      evidence_links: Table<
        { id: string; project_id: string; label: string; url: string; created_at: string },
        { id?: string; project_id: string; label: string; url: string }
      >
      self_eval_scores: Table<
        { entry_id: string; question_id: string; score: number },
        { entry_id: string; question_id: string; score: number }
      >
      self_eval_text_answers: Table<
        { entry_id: string; question_id: string; answer: string },
        { entry_id: string; question_id: string; answer: string }
      >
      scores: Table<
        {
          id: string; cycle_id: string; user_id: string
          downward_score: number | null; peer_score: number | null; upward_score: number | null
          total_score: number | null; calibrated_score: number | null; is_calibrated: boolean
        },
        {
          id?: string; cycle_id: string; user_id: string
          downward_score?: number | null; peer_score?: number | null; upward_score?: number | null
          total_score?: number | null; calibrated_score?: number | null; is_calibrated?: boolean
        }
      >
      mid_year_reviews: Table<
        {
          id: string; user_id: string; cycle_year: number; comment: string; grade: GradeT | null
          written_by: string | null; written_at: string | null; updated_at: string
        },
        {
          id?: string; user_id: string; cycle_year: number; comment?: string; grade?: GradeT | null
          written_by?: string | null; written_at?: string | null
        }
      >
      final_grades: Table<
        {
          id: string; cycle_id: string; user_id: string
          computed_grade: GradeT | null; final_grade: GradeT | null
          confirmed_by: string | null; confirmed_at: string | null; updated_at: string
        },
        {
          id?: string; cycle_id: string; user_id: string
          computed_grade?: GradeT | null; final_grade?: GradeT | null
          confirmed_by?: string | null; confirmed_at?: string | null
        }
      >
      idp: Table<
        { id: string; cycle_id: string; user_id: string; strengths: string; improvements: string },
        { id?: string; cycle_id: string; user_id: string; strengths?: string; improvements?: string }
      >
      idp_goals: Table<
        { id: string; idp_id: string; skill: string; action: string; due_date: string | null; status: IdpGoalStatusT },
        { id?: string; idp_id: string; skill: string; action: string; due_date?: string | null; status?: IdpGoalStatusT }
      >
    }
    Views: Record<string, never>
    Functions: {
      get_person_report: {
        Args: { p_target_id: string; p_cycle_id: string }
        Returns: {
          downward_score: number | null
          peer_score: number | null
          upward_score: number | null
          total_score: number | null
          peer_count: number
          upward_count: number
          peer_comments: string[]
          upward_comments: string[]
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
