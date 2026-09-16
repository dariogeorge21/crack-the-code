import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Team, GameState } from "@/types";

export type { Team, GameState };

export function extractLevelSplits(rawAnswer: string | null | undefined): {
  cleanAnswer: string | null;
  completedLevel2At: string | null;
  completedLevel3At: string | null;
  completedLevel4At: string | null;
} {
  if (!rawAnswer) return { cleanAnswer: null, completedLevel2At: null, completedLevel3At: null, completedLevel4At: null };
  const l2Match = rawAnswer.match(/\[L2:([^\]]+)\]/);
  const l3Match = rawAnswer.match(/\[L3:([^\]]+)\]/);
  const l4Match = rawAnswer.match(/\[L4:([^\]]+)\]/);
  const cleanAnswer = rawAnswer.replace(/\[L\d:[^\]]+\]/g, "").trim() || null;
  return {
    cleanAnswer,
    completedLevel2At: l2Match ? l2Match[1] : null,
    completedLevel3At: l3Match ? l3Match[1] : null,
    completedLevel4At: l4Match ? l4Match[1] : null,
  };
}

export function appendLevelSplit(rawAnswer: string | null | undefined, level: 2 | 3 | 4, timestamp: string): string {
  const current = rawAnswer || "";
  const tag = `[L${level}:${timestamp}]`;
  const regex = new RegExp(`\\[L${level}:[^\\]]+\\]`);
  if (regex.test(current)) {
    return current.replace(regex, tag);
  }
  return current ? `${current} ${tag}` : tag;
}

export function removeLevelSplit(rawAnswer: string | null | undefined, level: 2 | 3 | 4): string | null {
  if (!rawAnswer) return null;
  const regex = new RegExp(`\\[L${level}:[^\\]]+\\]`, "g");
  const cleaned = rawAnswer.replace(regex, "").replace(/\s+/g, " ").trim();
  return cleaned || null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Check if credentials are valid and configured
export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("your-project-id") &&
    Boolean(supabaseAnonKey) &&
    supabaseAnonKey !== "your-anon-key-here"
  );
};

let clientInstance: SupabaseClient | null = null;
let adminClientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }
  return clientInstance;
};

export const getAdminSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  const key = supabaseServiceRoleKey && supabaseServiceRoleKey !== "your-service-role-key-here"
    ? supabaseServiceRoleKey
    : supabaseAnonKey;
  if (!adminClientInstance) {
    adminClientInstance = createClient(supabaseUrl, key, {
      auth: { persistSession: false },
    });
  }
  return adminClientInstance;
};

// ==============================================================================
// In-Memory Dev / Local Fallback Store
// If Supabase credentials haven't been provided yet, the app continues to work smoothly!
// ==============================================================================
const DEFAULT_INITIAL_TEAMS: Team[] = [
  { id: "1", team_number: 1, team_name: "Team 01", team_code: "142", current_level: 1, started_at: null, round1_answer: null, first_digit: null, master_code: null, completed_level1_at: null, completed_level2_at: null, completed_level3_at: null, completed_level4_at: null },
  { id: "2", team_number: 2, team_name: "Team 02", team_code: "285", current_level: 1, started_at: null, round1_answer: null, first_digit: null, master_code: null, completed_level1_at: null, completed_level2_at: null, completed_level3_at: null, completed_level4_at: null },
  { id: "3", team_number: 3, team_name: "Team 03", team_code: "319", current_level: 1, started_at: null, round1_answer: null, first_digit: null, master_code: null, completed_level1_at: null, completed_level2_at: null, completed_level3_at: null, completed_level4_at: null },
  { id: "4", team_number: 4, team_name: "Team 04", team_code: "473", current_level: 1, started_at: null, round1_answer: null, first_digit: null, master_code: null, completed_level1_at: null, completed_level2_at: null, completed_level3_at: null, completed_level4_at: null },
  { id: "5", team_number: 5, team_name: "Team 05", team_code: "528", current_level: 1, started_at: null, round1_answer: null, first_digit: null, master_code: null, completed_level1_at: null, completed_level2_at: null, completed_level3_at: null, completed_level4_at: null },
  { id: "6", team_number: 6, team_name: "Team 06", team_code: "641", current_level: 1, started_at: null, round1_answer: null, first_digit: null, master_code: null, completed_level1_at: null, completed_level2_at: null, completed_level3_at: null, completed_level4_at: null },
  { id: "7", team_number: 7, team_name: "Team 07", team_code: "739", current_level: 1, started_at: null, round1_answer: null, first_digit: null, master_code: null, completed_level1_at: null, completed_level2_at: null, completed_level3_at: null, completed_level4_at: null },
  { id: "8", team_number: 8, team_name: "Team 08", team_code: "814", current_level: 1, started_at: null, round1_answer: null, first_digit: null, master_code: null, completed_level1_at: null, completed_level2_at: null, completed_level3_at: null, completed_level4_at: null },
  { id: "9", team_number: 9, team_name: "Team 09", team_code: "926", current_level: 1, started_at: null, round1_answer: null, first_digit: null, master_code: null, completed_level1_at: null, completed_level2_at: null, completed_level3_at: null, completed_level4_at: null },
  { id: "10", team_number: 10, team_name: "Team 10", team_code: "357", current_level: 1, started_at: null, round1_answer: null, first_digit: null, master_code: null, completed_level1_at: null, completed_level2_at: null, completed_level3_at: null, completed_level4_at: null },
  { id: "11", team_number: 11, team_name: "Team 11", team_code: "682", current_level: 1, started_at: null, round1_answer: null, first_digit: null, master_code: null, completed_level1_at: null, completed_level2_at: null, completed_level3_at: null, completed_level4_at: null },
];

// Global scope memory store across Next.js API route calls during dev
declare global {
  // eslint-disable-next-line no-var
  var __DEV_TEAMS_STORE: Team[] | undefined;
  // eslint-disable-next-line no-var
  var __DEV_GAME_RESET_AT: string | undefined;
}

export const getLocalTeams = (): Team[] => {
  if (!globalThis.__DEV_TEAMS_STORE) {
    globalThis.__DEV_TEAMS_STORE = JSON.parse(JSON.stringify(DEFAULT_INITIAL_TEAMS));
  }
  return globalThis.__DEV_TEAMS_STORE || [];
};

export const setLocalTeams = (teams: Team[]) => {
  globalThis.__DEV_TEAMS_STORE = teams;
};

export const getLocalResetTime = (): string => {
  if (!globalThis.__DEV_GAME_RESET_AT) {
    globalThis.__DEV_GAME_RESET_AT = new Date().toISOString();
  }
  return globalThis.__DEV_GAME_RESET_AT || new Date().toISOString();
};

export const triggerLocalReset = (): string => {
  const newTime = new Date().toISOString();
  globalThis.__DEV_GAME_RESET_AT = newTime;
  const teams = getLocalTeams();
  teams.forEach((t, index) => {
    t.current_level = 1;
    t.team_code = `RESET_${index + 1 < 10 ? "0" : ""}${index + 1}`;
    t.started_at = null;
    t.round1_answer = null;
    t.first_digit = null;
    t.master_code = null;
    t.completed_level1_at = null;
    t.completed_level2_at = null;
    t.completed_level3_at = null;
    t.completed_level4_at = null;
  });
  return newTime;
};

export const findLocalTeam = (identifier: string | number): Team | undefined => {
  const teams = getLocalTeams();
  const idStr = identifier.toString().trim();
  return teams.find(
    (t) =>
      t.id === idStr ||
      t.team_number.toString() === idStr ||
      t.team_code.toLowerCase() === idStr.toLowerCase()
  );
};

export const resetLocalTeam = (
  identifier: string | number,
  specificNewCode?: string
): Team | null => {
  const team = findLocalTeam(identifier);
  if (!team) return null;

  const allTeams = getLocalTeams();
  const otherTeamCodes = new Set(
    allTeams
      .filter((t) => t.id !== team.id && t.team_number !== team.team_number)
      .map((t) => t.team_code)
      .filter(Boolean)
  );

  let newCode = specificNewCode;
  if (!newCode) {
    let candidate = "";
    do {
      candidate = Math.floor(100 + Math.random() * 900).toString();
    } while (otherTeamCodes.has(candidate) || candidate.startsWith("RESET") || candidate.startsWith("FLUSH"));
    newCode = candidate;
  }

  const now = new Date().toISOString();
  team.team_code = newCode;
  team.current_level = 1;
  team.started_at = null;
  team.round1_answer = null;
  team.first_digit = null;
  team.master_code = null;
  team.completed_level1_at = null;
  team.completed_level2_at = null;
  team.completed_level3_at = null;
  team.completed_level4_at = null;
  team.updated_at = now;

  return team;
};

export const revertLocalTeamLevel = (
  identifier: string | number
): { team: Team; previousLevel: number; newLevel: number } | null => {
  const team = findLocalTeam(identifier);
  if (!team) return null;

  const currentLevel = team.current_level;
  if (currentLevel <= 1) return null;

  const now = new Date().toISOString();
  const newLevel = currentLevel - 1;

  if (currentLevel >= 5) {
    team.current_level = 4;
    team.completed_level4_at = null;
    team.round1_answer = removeLevelSplit(team.round1_answer, 4);
  } else if (currentLevel === 4) {
    team.current_level = 3;
    team.completed_level3_at = null;
    team.round1_answer = removeLevelSplit(team.round1_answer, 3);
  } else if (currentLevel === 3) {
    team.current_level = 2;
    team.completed_level2_at = null;
    team.round1_answer = removeLevelSplit(team.round1_answer, 2);
  } else if (currentLevel === 2) {
    team.current_level = 1;
    team.completed_level1_at = null;
    team.round1_answer = null;
    // master_code and first_digit are preserved!
  }

  team.updated_at = now;
  return { team, previousLevel: currentLevel, newLevel };
};
