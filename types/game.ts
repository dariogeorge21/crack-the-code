export interface Team {
  id: string;
  team_number: number;
  team_name: string;
  team_code: string;
  current_level: number;
  started_at: string | null;
  round1_answer: string | null;
  first_digit: number | null;
  master_code: string | null;
  completed_level1_at: string | null;
  completed_level2_at?: string | null;
  completed_level3_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GameState {
  id: number;
  game_session_id: string;
  reset_counter: number;
  last_reset_at: string;
}

export interface RoundData {
  number: number;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  detailedMechanic?: string;
  example_ideas: string[];
  feedback_prompt: string;
  isUnlockedInitially: boolean;
  accentColor: string;
}

export interface RuleItem {
  id: string;
  title: string;
  description: string;
  critical?: boolean;
}

export interface Coordinator {
  name: string;
  role: string;
  phone: string;
  displayPhone: string;
  email?: string;
}
