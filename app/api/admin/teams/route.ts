import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseConfigured, getLocalTeams, extractLevelSplits } from "@/lib/supabase";
import { Team } from "@/types";
import { formatDuration } from "@/lib/time";
import { computeMaskedMasterCode } from "@/lib/code-masking";
import { verifyAdminAuth } from "@/lib/auth/admin";

export async function GET() {
  try {
    const isAuthorized = await verifyAdminAuth();
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: Admin session required" },
        { status: 401 }
      );
    }

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
      const { cleanAnswer, completedLevel2At, completedLevel3At, completedLevel4At } = extractLevelSplits(team.round1_answer);
      const effectiveL2At = team.completed_level2_at || completedLevel2At || null;
      const effectiveL3At = team.completed_level3_at || completedLevel3At || null;
      const effectiveL4At = team.completed_level4_at || completedLevel4At || null;

      let timeTakenSeconds: number | null = null;
      let totalElapsedSeconds: number | null = null;
      let l1Seconds: number | null = null;
      let l2Seconds: number | null = null;
      let l2TotalSeconds: number | null = null;
      let l3Seconds: number | null = null;
      let l3TotalSeconds: number | null = null;
      let l4Seconds: number | null = null;
      let l4TotalSeconds: number | null = null;

      const isCodeFlushed = !team.team_code || team.team_code.startsWith("RESET") || team.team_code.startsWith("FLUSH");
      const displayCode = isCodeFlushed ? "" : team.team_code;
      let status: "NOT STARTED" | "AWAITING CODE" | "IN ROUND 1" | "LEVEL 2 UNLOCKED" | "LEVEL 3 UNLOCKED" | "LEVEL 4 UNLOCKED" | "FINISHED" = isCodeFlushed ? "AWAITING CODE" : "NOT STARTED";
      const isFinished = team.current_level >= 5 || Boolean(effectiveL4At);

      if (team.started_at) {
        const startTime = new Date(team.started_at).getTime();

        // L1 completion split
        let l1EndTime: number | null = null;
        if (team.completed_level1_at) {
          l1EndTime = new Date(team.completed_level1_at).getTime();
          l1Seconds = Math.max(0, Math.floor((l1EndTime - startTime) / 1000));
        }

        // L2 completion split
        let l2EndTime: number | null = null;
        if (effectiveL2At) {
          l2EndTime = new Date(effectiveL2At).getTime();
          l2TotalSeconds = Math.max(0, Math.floor((l2EndTime - startTime) / 1000));
          if (l1EndTime) {
            l2Seconds = Math.max(0, Math.floor((l2EndTime - l1EndTime) / 1000));
          } else {
            l2Seconds = l2TotalSeconds;
          }
        }

        // L3 completion split
        let l3EndTime: number | null = null;
        if (effectiveL3At) {
          l3EndTime = new Date(effectiveL3At).getTime();
          l3TotalSeconds = Math.max(0, Math.floor((l3EndTime - startTime) / 1000));
          if (l2EndTime) {
            l3Seconds = Math.max(0, Math.floor((l3EndTime - l2EndTime) / 1000));
          } else if (l1EndTime) {
            l3Seconds = Math.max(0, Math.floor((l3EndTime - l1EndTime) / 1000));
          } else {
            l3Seconds = l3TotalSeconds;
          }
        }

        // L4 completion split
        if (effectiveL4At) {
          const l4EndTime = new Date(effectiveL4At).getTime();
          l4TotalSeconds = Math.max(0, Math.floor((l4EndTime - startTime) / 1000));
          if (l3EndTime) {
            l4Seconds = Math.max(0, Math.floor((l4EndTime - l3EndTime) / 1000));
          } else if (l2EndTime) {
            l4Seconds = Math.max(0, Math.floor((l4EndTime - l2EndTime) / 1000));
          } else if (l1EndTime) {
            l4Seconds = Math.max(0, Math.floor((l4EndTime - l1EndTime) / 1000));
          } else {
            l4Seconds = l4TotalSeconds;
          }
        }

        // Total game timer: freezes ONLY when Level 4 is completed (Finished)!
        if (isFinished) {
          if (l1Seconds !== null && l2Seconds !== null && l3Seconds !== null && l4Seconds !== null) {
            totalElapsedSeconds = l1Seconds + l2Seconds + l3Seconds + l4Seconds;
          } else if (effectiveL4At) {
            totalElapsedSeconds = Math.max(0, Math.floor((new Date(effectiveL4At).getTime() - startTime) / 1000));
          } else {
            totalElapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
          }
          status = "FINISHED";
        } else {
          totalElapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
          status = team.current_level === 4
            ? "LEVEL 4 UNLOCKED"
            : team.current_level === 3
            ? "LEVEL 3 UNLOCKED"
            : team.current_level === 2
            ? "LEVEL 2 UNLOCKED"
            : "IN ROUND 1";
        }
        timeTakenSeconds = totalElapsedSeconds;
      }

      return {
        ...team,
        round1_answer: cleanAnswer,
        completed_level2_at: effectiveL2At,
        completed_level3_at: effectiveL3At,
        completed_level4_at: effectiveL4At,
        masked_master_code: computeMaskedMasterCode(team.master_code, team.first_digit, isFinished ? 5 : team.current_level),
        team_code: displayCode,
        is_code_flushed: isCodeFlushed,
        time_taken_seconds: timeTakenSeconds,
        time_taken_formatted: timeTakenSeconds !== null ? formatDuration(timeTakenSeconds) : "—",
        total_time_seconds: totalElapsedSeconds,
        total_time_formatted: totalElapsedSeconds !== null ? formatDuration(totalElapsedSeconds) : "—",
        l1_time_seconds: l1Seconds,
        l1_time_formatted: l1Seconds !== null ? formatDuration(l1Seconds) : null,
        l2_time_seconds: l2Seconds,
        l2_time_formatted: l2Seconds !== null ? formatDuration(l2Seconds) : null,
        l2_total_seconds: l2TotalSeconds,
        l2_total_formatted: l2TotalSeconds !== null ? formatDuration(l2TotalSeconds) : null,
        l3_time_seconds: l3Seconds,
        l3_time_formatted: l3Seconds !== null ? formatDuration(l3Seconds) : null,
        l3_total_seconds: l3TotalSeconds,
        l3_total_formatted: l3TotalSeconds !== null ? formatDuration(l3TotalSeconds) : null,
        l4_time_seconds: l4Seconds,
        l4_time_formatted: l4Seconds !== null ? formatDuration(l4Seconds) : null,
        l4_total_seconds: l4TotalSeconds,
        l4_total_formatted: l4TotalSeconds !== null ? formatDuration(l4TotalSeconds) : null,
        status,
        is_finished: isFinished,
        rank: null as number | null,
      };
    });

    // Compute Ranks for Finished Teams based on total_time_seconds ascending
    const finishedTeams = formattedTeams
      .filter((t) => t.is_finished && t.total_time_seconds !== null)
      .sort((a, b) => (a.total_time_seconds || 0) - (b.total_time_seconds || 0));

    const rankMap = new Map<string, number>();
    finishedTeams.forEach((t, idx) => {
      rankMap.set(t.id || t.team_code, idx + 1);
    });

    formattedTeams.forEach((t) => {
      if (t.is_finished) {
        t.rank = rankMap.get(t.id || t.team_code) || null;
      }
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
