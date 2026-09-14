import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured, getLocalTeams, appendLevelSplit, extractLevelSplits } from "@/lib/supabase";
import { formatDuration } from "@/lib/time";
import { Team } from "@/types";

const TARGET_FLAG = "FLAG{alex_left_more_than_a_message}";

function normalizeFlag(input: string): string {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export async function POST(req: Request) {
  try {
    const { teamCode, flag } = await req.json();

    if (!teamCode || typeof teamCode !== "string") {
      return NextResponse.json({ error: "teamCode is required" }, { status: 400 });
    }

    if (!flag || typeof flag !== "string") {
      return NextResponse.json({ error: "Flag input is required" }, { status: 400 });
    }

    const trimmedCode = teamCode.trim();
    const cleanFlag = normalizeFlag(flag);
    const expectedFlag = normalizeFlag(TARGET_FLAG);
    const expectedInner = normalizeFlag("alex_left_more_than_a_message");

    // Allow both full FLAG{...} and inner content
    if (cleanFlag !== expectedFlag && cleanFlag !== expectedInner) {
      return NextResponse.json(
        { error: "INVALID FLAG: Decryption signature mismatch. Check your findings." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const nowMs = new Date(now).getTime();

    if (isSupabaseConfigured()) {
      const supabase = getSupabase()!;

      const { data: team, error: fetchErr } = await supabase
        .from("teams")
        .select("*")
        .eq("team_code", trimmedCode)
        .single();

      if (fetchErr || !team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      if (team.current_level < 4) {
        return NextResponse.json(
          { error: "ACCESS DENIED: Must clear Level 3 first." },
          { status: 403 }
        );
      }

      // Ensure 10-digit master code exists
      let fullMasterCode = team.master_code;
      if (!fullMasterCode || fullMasterCode.length < 10) {
        const prefix = team.first_digit !== null ? team.first_digit.toString() : "7";
        let rest = "";
        while (prefix.length + rest.length < 10) {
          rest += Math.floor(Math.random() * 10).toString();
        }
        fullMasterCode = (prefix + rest).slice(0, 10);
      }

      // Digits 7, 8, 9, 10 are indices 6, 7, 8, 9
      const digit7 = fullMasterCode[6] || "9";
      const digit8 = fullMasterCode[7] || "1";
      const digit9 = fullMasterCode[8] || "5";
      const digit10 = fullMasterCode[9] || "8";
      const finalDigits = [digit7, digit8, digit9, digit10];

      // Extract existing splits
      const { completedLevel2At, completedLevel3At } = extractLevelSplits(team.round1_answer);
      const effectiveL2At = team.completed_level2_at || completedLevel2At || null;
      const effectiveL3At = team.completed_level3_at || completedLevel3At || null;

      let l1Seconds: number | null = null;
      let l2Seconds: number | null = null;
      let l3Seconds: number | null = null;
      let l4Seconds: number | null = null;
      let totalSeconds: number | null = null;

      if (team.started_at) {
        const startMs = new Date(team.started_at).getTime();
        const l1Ms = team.completed_level1_at ? new Date(team.completed_level1_at).getTime() : startMs;
        l1Seconds = Math.max(0, Math.floor((l1Ms - startMs) / 1000));

        const l2Ms = effectiveL2At ? new Date(effectiveL2At).getTime() : l1Ms;
        l2Seconds = Math.max(0, Math.floor((l2Ms - l1Ms) / 1000));

        const l3Ms = effectiveL3At ? new Date(effectiveL3At).getTime() : l2Ms;
        l3Seconds = Math.max(0, Math.floor((l3Ms - l2Ms) / 1000));

        l4Seconds = Math.max(0, Math.floor((nowMs - l3Ms) / 1000));
        totalSeconds = l1Seconds + l2Seconds + l3Seconds + l4Seconds;
      }

      const l1SplitFormatted = l1Seconds !== null ? formatDuration(l1Seconds) : null;
      const l2SplitFormatted = l2Seconds !== null ? formatDuration(l2Seconds) : null;
      const l3SplitFormatted = l3Seconds !== null ? formatDuration(l3Seconds) : null;
      const l4SplitFormatted = l4Seconds !== null ? formatDuration(l4Seconds) : null;
      const totalFormatted = totalSeconds !== null ? formatDuration(totalSeconds) : null;

      const updatedRound1Answer = appendLevelSplit(team.round1_answer, 4, now);
      const nextLevel = 5; // Level 5 = Game Completed / Won

      const updatePayload: Record<string, unknown> = {
        master_code: fullMasterCode,
        current_level: nextLevel,
        round1_answer: updatedRound1Answer,
        completed_level4_at: now,
        updated_at: now,
      };

      let { data: updatedTeam, error: updateErr } = await supabase
        .from("teams")
        .update(updatePayload)
        .eq("team_code", trimmedCode)
        .select()
        .single();

      if (updateErr) {
        // Fallback if completed_level4_at column is not yet in Supabase schema
        delete updatePayload.completed_level4_at;
        const retry = await supabase
          .from("teams")
          .update(updatePayload)
          .eq("team_code", trimmedCode)
          .select()
          .single();
        updatedTeam = retry.data;
      }

      // Fetch leaderboard
      const { data: allTeams } = await supabase
        .from("teams")
        .select("team_number, team_name, current_level, started_at, completed_level1_at, round1_answer, master_code");

      const leaderboard = (allTeams || []).map((t: { team_number: number; team_name: string; current_level: number; round1_answer?: string | null }) => {
        const splits = extractLevelSplits(t.round1_answer);
        return {
          team_number: t.team_number,
          team_name: t.team_name,
          current_level: t.current_level,
          cleared: t.current_level >= 5 || Boolean(splits.completedLevel4At),
        };
      });

      return NextResponse.json({
        success: true,
        gameWon: true,
        currentLevel: nextLevel,
        levelCleared: true,
        revealedDigits: finalDigits,
        unlockedCount: 10,
        masterCode: fullMasterCode,
        team: {
          ...(updatedTeam || team),
          master_code: fullMasterCode,
          current_level: nextLevel,
          completed_level4_at: now,
        },
        splitTime: {
          l1Seconds,
          l1Formatted: l1SplitFormatted,
          l2Seconds,
          l2Formatted: l2SplitFormatted,
          l3Seconds,
          l3Formatted: l3SplitFormatted,
          l4Seconds,
          l4Formatted: l4SplitFormatted,
          totalSeconds,
          totalFormatted,
        },
        leaderboard,
      });
    } else {
      // Local fallback
      const teams = getLocalTeams();
      const team = teams.find((t) => t.team_code === trimmedCode);

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      if (team.current_level < 4) {
        return NextResponse.json(
          { error: "ACCESS DENIED: Must clear Level 3 first." },
          { status: 403 }
        );
      }

      let fullMasterCode = team.master_code;
      if (!fullMasterCode || fullMasterCode.length < 10) {
        const prefix = team.first_digit !== null ? team.first_digit.toString() : "7";
        let rest = "";
        while (prefix.length + rest.length < 10) {
          rest += Math.floor(Math.random() * 10).toString();
        }
        fullMasterCode = (prefix + rest).slice(0, 10);
      }

      const digit7 = fullMasterCode[6] || "9";
      const digit8 = fullMasterCode[7] || "1";
      const digit9 = fullMasterCode[8] || "5";
      const digit10 = fullMasterCode[9] || "8";
      const finalDigits = [digit7, digit8, digit9, digit10];

      const { completedLevel2At, completedLevel3At } = extractLevelSplits(team.round1_answer);
      const effectiveL2At = team.completed_level2_at || completedLevel2At || null;
      const effectiveL3At = team.completed_level3_at || completedLevel3At || null;

      let l1Seconds: number | null = null;
      let l2Seconds: number | null = null;
      let l3Seconds: number | null = null;
      let l4Seconds: number | null = null;
      let totalSeconds: number | null = null;

      if (team.started_at) {
        const startMs = new Date(team.started_at).getTime();
        const l1Ms = team.completed_level1_at ? new Date(team.completed_level1_at).getTime() : startMs;
        l1Seconds = Math.max(0, Math.floor((l1Ms - startMs) / 1000));

        const l2Ms = effectiveL2At ? new Date(effectiveL2At).getTime() : l1Ms;
        l2Seconds = Math.max(0, Math.floor((l2Ms - l1Ms) / 1000));

        const l3Ms = effectiveL3At ? new Date(effectiveL3At).getTime() : l2Ms;
        l3Seconds = Math.max(0, Math.floor((l3Ms - l2Ms) / 1000));

        l4Seconds = Math.max(0, Math.floor((nowMs - l3Ms) / 1000));
        totalSeconds = l1Seconds + l2Seconds + l3Seconds + l4Seconds;
      }

      const l1SplitFormatted = l1Seconds !== null ? formatDuration(l1Seconds) : null;
      const l2SplitFormatted = l2Seconds !== null ? formatDuration(l2Seconds) : null;
      const l3SplitFormatted = l3Seconds !== null ? formatDuration(l3Seconds) : null;
      const l4SplitFormatted = l4Seconds !== null ? formatDuration(l4Seconds) : null;
      const totalFormatted = totalSeconds !== null ? formatDuration(totalSeconds) : null;

      const updatedRound1Answer = appendLevelSplit(team.round1_answer, 4, now);
      const nextLevel = 5;

      team.current_level = nextLevel;
      team.master_code = fullMasterCode;
      team.round1_answer = updatedRound1Answer;
      team.completed_level4_at = now;
      team.updated_at = now;

      const leaderboard = teams.map((t) => {
        const splits = extractLevelSplits(t.round1_answer);
        return {
          team_number: t.team_number,
          team_name: t.team_name,
          current_level: t.current_level,
          cleared: t.current_level >= 5 || Boolean(splits.completedLevel4At),
        };
      });

      return NextResponse.json({
        success: true,
        gameWon: true,
        currentLevel: nextLevel,
        levelCleared: true,
        revealedDigits: finalDigits,
        unlockedCount: 10,
        masterCode: fullMasterCode,
        team: {
          ...team,
          master_code: fullMasterCode,
          current_level: nextLevel,
          completed_level4_at: now,
        },
        splitTime: {
          l1Seconds,
          l1Formatted: l1SplitFormatted,
          l2Seconds,
          l2Formatted: l2SplitFormatted,
          l3Seconds,
          l3Formatted: l3SplitFormatted,
          l4Seconds,
          l4Formatted: l4SplitFormatted,
          totalSeconds,
          totalFormatted,
        },
        leaderboard,
      });
    }
  } catch (err: unknown) {
    console.error("submit-round4 error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
