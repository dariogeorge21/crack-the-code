import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured, getLocalTeams, appendLevelSplit, extractLevelSplits } from "@/lib/supabase";
import { formatDuration } from "@/lib/time";
import { ROUND_ACCESS_CODES } from "@/constants";

export async function POST(req: Request) {
  try {
    const { teamCode, accessCode } = await req.json();

    if (!teamCode || typeof teamCode !== "string") {
      return NextResponse.json({ error: "teamCode is required" }, { status: 400 });
    }

    const trimmedCode = teamCode.trim();

    // Verify Access Code if supplied (expected 41 for Airport Simulation, with tolerance for 88)
    const cleanAccessCode = (accessCode || "").toString().trim();
    if (cleanAccessCode && cleanAccessCode !== ROUND_ACCESS_CODES.ROUND_3 && cleanAccessCode !== ROUND_ACCESS_CODES.ROUND_2) {
      return NextResponse.json(
        { error: `INVALID ACCESS CODE FOR ROUND 3. Expected ${ROUND_ACCESS_CODES.ROUND_3}.` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const nowMs = new Date(now).getTime();

    if (isSupabaseConfigured()) {
      const supabase = getSupabase()!;

      // Fetch team
      const { data: team, error: fetchErr } = await supabase
        .from("teams")
        .select("*")
        .eq("team_code", trimmedCode)
        .single();

      if (fetchErr || !team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      if (team.current_level < 3) {
        return NextResponse.json(
          { error: "ACCESS DENIED: Must clear Level 2 first." },
          { status: 403 }
        );
      }

      // Ensure team has a valid 10-digit master_code in DB
      let fullMasterCode = team.master_code;
      if (!fullMasterCode || fullMasterCode.length < 10) {
        const prefix = team.first_digit !== null ? team.first_digit.toString() : "7";
        let rest = "";
        while (prefix.length + rest.length < 10) {
          rest += Math.floor(Math.random() * 10).toString();
        }
        fullMasterCode = (prefix + rest).slice(0, 10);
      }

      // The next 3 digits are index 3, 4, 5 (revealing 6 of 10 digits total)
      const digit4 = fullMasterCode[3] || "8";
      const digit5 = fullMasterCode[4] || "4";
      const digit6 = fullMasterCode[5] || "2";
      const newDigits = [digit4, digit5, digit6];

      // New masked code reveals 6 digits, 4 asterisks
      const newMaskedCode = fullMasterCode.slice(0, 6) + "****";

      // Advance to level 4 if currently at level 3
      const nextLevel = Math.max(team.current_level, 4);

      // Extract existing splits from round1_answer
      const { completedLevel2At } = extractLevelSplits(team.round1_answer);
      const effectiveL2At = team.completed_level2_at || completedLevel2At || null;

      // Compute split times
      let l3Seconds: number | null = null;
      let totalSeconds: number | null = null;
      let l2Seconds: number | null = null;
      let l1Seconds: number | null = null;

      if (team.started_at) {
        const startMs = new Date(team.started_at).getTime();
        const l1Ms = team.completed_level1_at ? new Date(team.completed_level1_at).getTime() : startMs;
        l1Seconds = Math.max(0, Math.floor((l1Ms - startMs) / 1000));

        const l2Ms = effectiveL2At ? new Date(effectiveL2At).getTime() : l1Ms;
        l2Seconds = Math.max(0, Math.floor((l2Ms - l1Ms) / 1000));

        l3Seconds = Math.max(0, Math.floor((nowMs - l2Ms) / 1000));
        totalSeconds = l1Seconds + l2Seconds + l3Seconds;
      }

      const l3SplitFormatted = l3Seconds !== null ? formatDuration(l3Seconds) : null;
      const l2SplitFormatted = l2Seconds !== null ? formatDuration(l2Seconds) : null;
      const l1SplitFormatted = l1Seconds !== null ? formatDuration(l1Seconds) : null;
      const totalFormatted = totalSeconds !== null ? formatDuration(totalSeconds) : null;

      // Schema-resilient split storage: append [L3:<iso>] to round1_answer
      const updatedRound1Answer = appendLevelSplit(team.round1_answer, 3, now);

      // Update team with level advancement and L3 tagged timestamp
      const updatePayload: Record<string, unknown> = {
        master_code: fullMasterCode,
        current_level: nextLevel,
        round1_answer: updatedRound1Answer,
        completed_level3_at: now,
        updated_at: now,
      };

      let { data: updatedTeam, error: updateErr } = await supabase
        .from("teams")
        .update(updatePayload)
        .eq("team_code", trimmedCode)
        .select()
        .single();

      if (updateErr) {
        // Fallback if column completed_level3_at hasn't been migrated yet in Supabase
        const fallbackPayload = {
          master_code: fullMasterCode,
          current_level: nextLevel,
          round1_answer: updatedRound1Answer,
          updated_at: now,
        };
        const retry = await supabase
          .from("teams")
          .update(fallbackPayload)
          .eq("team_code", trimmedCode)
          .select()
          .single();
        if (retry.error || !retry.data) {
          console.error("submit-round3 db update error:", updateErr);
          return NextResponse.json({ error: "Failed to update team progress" }, { status: 500 });
        }
        updatedTeam = retry.data;
      }

      const { cleanAnswer } = extractLevelSplits(updatedTeam.round1_answer);
      const safeTeam = {
        ...updatedTeam,
        round1_answer: cleanAnswer,
        master_code: newMaskedCode,
        completed_level2_at: effectiveL2At,
        completed_level3_at: now,
      };

      return NextResponse.json({
        success: true,
        currentLevel: nextLevel,
        levelCleared: true,
        revealedDigits: newDigits,
        unlockedCount: 6,
        maskedMasterCode: newMaskedCode,
        team: safeTeam,
        completed_level3_at: now,
        splitTime: {
          l1Seconds,
          l1Formatted: l1SplitFormatted,
          l2Seconds,
          l2Formatted: l2SplitFormatted,
          l3Seconds,
          l3Formatted: l3SplitFormatted,
          totalSeconds,
          totalFormatted,
        },
      });
    } else {
      // Local dev fallback
      const teams = getLocalTeams();
      const team = teams.find((t) => t.team_code === trimmedCode);

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      if (team.current_level < 3) {
        return NextResponse.json(
          { error: "ACCESS DENIED: Must clear Level 2 first." },
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

      const digit4 = fullMasterCode[3] || "8";
      const digit5 = fullMasterCode[4] || "4";
      const digit6 = fullMasterCode[5] || "2";
      const newDigits = [digit4, digit5, digit6];

      const newMaskedCode = fullMasterCode.slice(0, 6) + "****";
      const nextLevel = Math.max(team.current_level, 4);

      const { completedLevel2At } = extractLevelSplits(team.round1_answer);
      const effectiveL2At = team.completed_level2_at || completedLevel2At || null;

      let l3Seconds: number | null = null;
      let totalSeconds: number | null = null;
      let l2Seconds: number | null = null;
      let l1Seconds: number | null = null;

      if (team.started_at) {
        const startMs = new Date(team.started_at).getTime();
        const l1Ms = team.completed_level1_at ? new Date(team.completed_level1_at).getTime() : startMs;
        l1Seconds = Math.max(0, Math.floor((l1Ms - startMs) / 1000));

        const l2Ms = effectiveL2At ? new Date(effectiveL2At).getTime() : l1Ms;
        l2Seconds = Math.max(0, Math.floor((l2Ms - l1Ms) / 1000));

        l3Seconds = Math.max(0, Math.floor((nowMs - l2Ms) / 1000));
        totalSeconds = l1Seconds + l2Seconds + l3Seconds;
      }

      const l3SplitFormatted = l3Seconds !== null ? formatDuration(l3Seconds) : null;
      const l2SplitFormatted = l2Seconds !== null ? formatDuration(l2Seconds) : null;
      const l1SplitFormatted = l1Seconds !== null ? formatDuration(l1Seconds) : null;
      const totalFormatted = totalSeconds !== null ? formatDuration(totalSeconds) : null;

      const updatedRound1Answer = appendLevelSplit(team.round1_answer, 3, now);
      team.current_level = nextLevel;
      team.master_code = fullMasterCode;
      team.round1_answer = updatedRound1Answer;
      team.completed_level3_at = now;
      team.updated_at = now;

      const { cleanAnswer } = extractLevelSplits(team.round1_answer);
      const safeTeam = {
        ...team,
        round1_answer: cleanAnswer,
        master_code: newMaskedCode,
      };

      return NextResponse.json({
        success: true,
        currentLevel: nextLevel,
        levelCleared: true,
        revealedDigits: newDigits,
        unlockedCount: 6,
        maskedMasterCode: newMaskedCode,
        team: safeTeam,
        completed_level3_at: now,
        splitTime: {
          l1Seconds,
          l1Formatted: l1SplitFormatted,
          l2Seconds,
          l2Formatted: l2SplitFormatted,
          l3Seconds,
          l3Formatted: l3SplitFormatted,
          totalSeconds,
          totalFormatted,
        },
      });
    }
  } catch (err: unknown) {
    console.error("submit-round3 error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
