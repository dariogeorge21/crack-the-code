export interface AdminTeamData {
  id: string;
  team_number: number;
  team_name: string;
  team_code: string;
  current_level: number;
  started_at: string | null;
  completed_level1_at: string | null;
  completed_level2_at?: string | null;
  completed_level3_at?: string | null;
  masked_master_code?: string | null;
  time_taken_seconds: number | null;
  time_taken_formatted: string;
  total_time_seconds?: number | null;
  total_time_formatted?: string;
  l1_time_seconds?: number | null;
  l1_time_formatted?: string | null;
  l2_time_seconds?: number | null;
  l2_time_formatted?: string | null;
  l2_total_seconds?: number | null;
  l2_total_formatted?: string | null;
  l3_time_seconds?: number | null;
  l3_time_formatted?: string | null;
  l3_total_seconds?: number | null;
  l3_total_formatted?: string | null;
  round1_answer: string | null;
  first_digit: number | null;
  master_code: string | null;
  status: string;
  is_code_flushed?: boolean;
}

export interface LockoutStatus {
  lockedOut: boolean;
  secondsRemaining: number;
  attemptsRemaining: number;
}
