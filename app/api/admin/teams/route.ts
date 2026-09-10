import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseConfigured, getLocalTeams, Team } from "@/lib/supabase";

function formatDuration(seconds: number): string {
  if (seconds < 0) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m ${secs}s`;
  }
  return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
}

export async function GET() {
  try {
    let teams: Team[] = [];

    if (isSupabaseConfigured()) {
      const supabase = getAdminSupabase()!;
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("team_number", { ascending: true });

      if (error) {
        console.warn("fetch teams db error (falling back to local store until SQL schema is run):", error.message);
        teams = getLocalTeams().sort((a, b) => a.team_number - b.team_number);
      } else {
        teams = data || [];
      }
    } else {
      teams = getLocalTeams().sort((a, b) => a.team_number - b.team_number);
    }

    const now = new Date().getTime();

    const formattedTeams = teams.map((team) => {
      let timeTakenSeconds: number | null = null;
      let totalElapsedSeconds: number | null = null;
      let l1Seconds: number | null = null;
      const isCodeFlushed = !team.team_code || team.team_code.startsWith("RESET") || team.team_code.startsWith("FLUSH");
      const displayCode = isCodeFlushed ? "" : team.team_code;
      let status: "NOT STARTED" | "AWAITING CODE" | "IN ROUND 1" | "LEVEL 2 UNLOCKED" = isCodeFlushed ? "AWAITING CODE" : "NOT STARTED";

      if (team.started_at) {
        const startTime = new Date(team.started_at).getTime();
        
        // Total game timer runs continuously from started_at no matter what
        totalElapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
        timeTakenSeconds = totalElapsedSeconds;

        if (team.completed_level1_at) {
          const l1Time = new Date(team.completed_level1_at).getTime();
          l1Seconds = Math.max(0, Math.floor((l1Time - startTime) / 1000));
        }

        status = team.current_level >= 2 ? "LEVEL 2 UNLOCKED" : "IN ROUND 1";
      }

      return {
        ...team,
        team_code: displayCode,
        is_code_flushed: isCodeFlushed,
        time_taken_seconds: timeTakenSeconds,
        time_taken_formatted: timeTakenSeconds !== null ? formatDuration(timeTakenSeconds) : "—",
        total_time_seconds: totalElapsedSeconds,
        total_time_formatted: totalElapsedSeconds !== null ? formatDuration(totalElapsedSeconds) : "—",
        l1_time_seconds: l1Seconds,
        l1_time_formatted: l1Seconds !== null ? formatDuration(l1Seconds) : null,
        status,
      };
    });

    return NextResponse.json({
      success: true,
      teams: formattedTeams,
      count: formattedTeams.length,
      serverTime: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("admin teams route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
