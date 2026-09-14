import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured, getLocalTeams, extractLevelSplits } from "@/lib/supabase";
import { formatDuration } from "@/lib/time";
import { Team } from "@/types";

export async function GET() {
  try {
    let teams: Team[] = [];

    if (isSupabaseConfigured()) {
      const supabase = getSupabase()!;
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("team_number", { ascending: true });

      teams = error || !data ? getLocalTeams() : data;
    } else {
      teams = getLocalTeams();
    }

    const leaderboard = teams.map((team) => {
      const { completedLevel2At, completedLevel3At } = extractLevelSplits(team.round1_answer);
      const effectiveL2At = team.completed_level2_at || completedLevel2At || null;
      const effectiveL3At = team.completed_level3_at || completedLevel3At || null;

      let totalSeconds: number | null = null;
      let l1Seconds: number | null = null;
      let l2Seconds: number | null = null;
      let l3Seconds: number | null = null;

      if (team.started_at) {
        const startMs = new Date(team.started_at).getTime();
        if (team.completed_level1_at) {
          l1Seconds = Math.max(0, Math.floor((new Date(team.completed_level1_at).getTime() - startMs) / 1000));
        }
        if (effectiveL2At && team.completed_level1_at) {
          l2Seconds = Math.max(0, Math.floor((new Date(effectiveL2At).getTime() - new Date(team.completed_level1_at).getTime()) / 1000));
        }
        if (effectiveL3At && effectiveL2At) {
          l3Seconds = Math.max(0, Math.floor((new Date(effectiveL3At).getTime() - new Date(effectiveL2At).getTime()) / 1000));
        }

        if (effectiveL3At || team.current_level >= 4) {
          totalSeconds = (l1Seconds || 0) + (l2Seconds || 0) + (l3Seconds || 0);
        } else {
          totalSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        }
      }

      const isWinner = team.current_level >= 4 || Boolean(effectiveL3At);

      return {
        id: team.id,
        team_number: team.team_number,
        team_name: team.team_name,
        current_level: team.current_level,
        is_winner: isWinner,
        total_seconds: totalSeconds,
        total_formatted: totalSeconds !== null ? formatDuration(totalSeconds) : "—",
        l1_formatted: l1Seconds !== null ? formatDuration(l1Seconds) : null,
        l2_formatted: l2Seconds !== null ? formatDuration(l2Seconds) : null,
        l3_formatted: l3Seconds !== null ? formatDuration(l3Seconds) : null,
      };
    });

    // Rank: Winners first (sorted by total_seconds ascending), then by current_level descending
    leaderboard.sort((a, b) => {
      if (a.is_winner && !b.is_winner) return -1;
      if (!a.is_winner && b.is_winner) return 1;
      if (a.is_winner && b.is_winner) {
        return (a.total_seconds || 999999) - (b.total_seconds || 999999);
      }
      if (b.current_level !== a.current_level) {
        return b.current_level - a.current_level;
      }
      return (a.total_seconds || 999999) - (b.total_seconds || 999999);
    });

    return NextResponse.json({ leaderboard });
  } catch (err: unknown) {
    console.error("leaderboard error:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
