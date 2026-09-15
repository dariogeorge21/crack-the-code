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

    // Verify Access Code (expected 88 for Diamond Pattern, with backwards tolerance for 41)
    const cleanAccessCode = (accessCode || "").toString().trim();
    if (cleanAccessCode !== ROUND_ACCESS_CODES.ROUND_2 && cleanAccessCode !== ROUND_ACCESS_CODES.ROUND_3) {
      return NextResponse.json(
        { error: `INVALID ACCESS CODE FOR ROUND 2. Expected ${ROUND_ACCESS_CODES.ROUND_2}.` },
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

      if (team.current_level < 2) {
        return NextResponse.json(
          { error: "ACCESS DENIED: Must clear Level 1 first." },
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

      // The next 2 digits are index 1 and 2
      const digit2 = fullMasterCode[1];
      const digit3 = fullMasterCode[2];
      const newDigits = [digit2, digit3];

      // New masked code reveals 3 digits, 7 asterisks
      const newMaskedCode = fullMasterCode.slice(0, 3) + "*******";

      // Advance to level 3 if currently at level 2
      const nextLevel = Math.max(team.current_level, 3);

      // Compute split times
      let l2Seconds: number | null = null;
      let totalSeconds: number | null = null;
      let l1Seconds: number | null = null;

      if (team.started_at) {
        const startMs = new Date(team.started_at).getTime();
        if (team.completed_level1_at) {
          const l1Ms = new Date(team.completed_level1_at).getTime();
          l1Seconds = Math.max(0, Math.floor((l1Ms - startMs) / 1000));
          l2Seconds = Math.max(0, Math.floor((nowMs - l1Ms) / 1000));
          totalSeconds = l1Seconds + l2Seconds;
        } else {
          totalSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
          l2Seconds = totalSeconds;
        }
      }

      const l2SplitFormatted = l2Seconds !== null ? formatDuration(l2Seconds) : null;
      const l1SplitFormatted = l1Seconds !== null ? formatDuration(l1Seconds) : null;
      const totalFormatted = totalSeconds !== null ? formatDuration(totalSeconds) : null;

      // Schema-resilient split storage: append [L2:<iso>] to round1_answer
      const updatedRound1Answer = appendLevelSplit(team.round1_answer, 2, now);

      // Update team with level advancement and L2 tagged timestamp
      const updatePayload: Record<string, unknown> = {
        master_code: fullMasterCode,
        current_level: nextLevel,
        round1_answer: updatedRound1Answer,
        completed_level2_at: now,
        updated_at: now,
      };

      let { data: updatedTeam, error: updateErr } = await supabase
        .from("teams")
        .update(updatePayload)
        .eq("team_code", trimmedCode)
        .select()
        .single();

      if (updateErr) {
        // Fallback if column completed_level2_at hasn't been migrated yet in Supabase
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
          console.error("submit-round2 db update error:", updateErr);
          return NextResponse.json({ error: "Failed to update team progress" }, { status: 500 });
        }
        updatedTeam = retry.data;
      }

      const { cleanAnswer } = extractLevelSplits(updatedTeam.round1_answer);
      const safeTeam = {
        ...updatedTeam,
        round1_answer: cleanAnswer,
        master_code: newMaskedCode,
        completed_level2_at: now,
      };

      return NextResponse.json({
        success: true,
        currentLevel: nextLevel,
        levelCleared: true,
        revealedDigits: newDigits,
        unlockedCount: 3,
        maskedMasterCode: newMaskedCode,
        team: safeTeam,
        serverTime: now,
        completed_level2_at: now,
        splitTime: {
          l1Seconds,
          l1Formatted: l1SplitFormatted,
          l2Seconds,
          l2Formatted: l2SplitFormatted,
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

      if (team.current_level < 2) {
        return NextResponse.json(
          { error: "ACCESS DENIED: Must clear Level 1 first." },
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

      const digit2 = fullMasterCode[1];
      const digit3 = fullMasterCode[2];
      const newDigits = [digit2, digit3];
      const newMaskedCode = fullMasterCode.slice(0, 3) + "*******";

      const nextLevel = Math.max(team.current_level, 3);

      // Compute split times
      let l2Seconds: number | null = null;
      let totalSeconds: number | null = null;
      let l1Seconds: number | null = null;

      if (team.started_at) {
        const startMs = new Date(team.started_at).getTime();
        if (team.completed_level1_at) {
          const l1Ms = new Date(team.completed_level1_at).getTime();
          l1Seconds = Math.max(0, Math.floor((l1Ms - startMs) / 1000));
          l2Seconds = Math.max(0, Math.floor((nowMs - l1Ms) / 1000));
          totalSeconds = l1Seconds + l2Seconds;
        } else {
          totalSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
          l2Seconds = totalSeconds;
        }
      }

      const l2SplitFormatted = l2Seconds !== null ? formatDuration(l2Seconds) : null;
      const l1SplitFormatted = l1Seconds !== null ? formatDuration(l1Seconds) : null;
      const totalFormatted = totalSeconds !== null ? formatDuration(totalSeconds) : null;

      const updatedRound1Answer = appendLevelSplit(team.round1_answer, 2, now);
      team.master_code = fullMasterCode;
      team.current_level = nextLevel;
      team.round1_answer = updatedRound1Answer;
      team.completed_level2_at = now;
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
        unlockedCount: 3,
        maskedMasterCode: newMaskedCode,
        team: safeTeam,
        serverTime: now,
        completed_level2_at: now,
        splitTime: {
          l1Seconds,
          l1Formatted: l1SplitFormatted,
          l2Seconds,
          l2Formatted: l2SplitFormatted,
          totalSeconds,
          totalFormatted,
        },
      });
    }
  } catch (err: unknown) {
    console.error("submit-round2 error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
