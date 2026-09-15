import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured, getLocalTeams } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { teamId, teamCode, round1Answer, firstDigit, firstChar } = await req.json();

    if (!round1Answer || typeof round1Answer !== "string" || !round1Answer.trim()) {
      return NextResponse.json({ error: "Round 1 answer is required" }, { status: 400 });
    }

    const formattedAnswer = round1Answer.trim().toUpperCase();

    const rawChar = (firstDigit !== undefined && firstDigit !== null ? firstDigit : firstChar || "").toString().trim().toUpperCase();
    if (!rawChar || !/^[A-Z]$/.test(rawChar)) {
      return NextResponse.json({ error: "First letter of code must be a single alphabet character (A-Z)" }, { status: 400 });
    }

    const charPrefix = rawChar;

    // Generate 10-character code starting with the team's input alphabet letter followed by 9 digits
    const remainingCount = Math.max(0, 10 - charPrefix.length);
    let remainingDigits = "";
    for (let i = 0; i < remainingCount; i++) {
      remainingDigits += Math.floor(Math.random() * 10).toString();
    }
    const masterCode = (charPrefix + remainingDigits).slice(0, 10);

    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabase()!;

      // Fetch existing team to check if already started
      let findQuery = supabase.from("teams").select("*");
      if (teamId) {
        findQuery = findQuery.eq("id", teamId);
      } else if (teamCode) {
        findQuery = findQuery.eq("team_code", teamCode);
      } else {
        return NextResponse.json({ error: "teamId or teamCode is required" }, { status: 400 });
      }

      const { data: existingTeam, error: fetchErr } = await findQuery.single();
      if (fetchErr || !existingTeam) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      // Prevent state downgrade or master code tampering if Round 1 is already cleared
      if (existingTeam.current_level >= 2 && existingTeam.master_code) {
        const maskedMasterCode = existingTeam.master_code.slice(0, 1) + "*********";
        const safeTeam = { ...existingTeam, master_code: maskedMasterCode };
        return NextResponse.json({
          success: true,
          currentLevel: existingTeam.current_level,
          levelCleared: true,
          maskedMasterCode,
          team: safeTeam,
          serverTime: now,
        });
      }

      // START TIMER HERE: Set started_at only when master key is generated!
      const startedAt = existingTeam.started_at || now;

      // Preserve existing allocated master_code if prefix matches, otherwise use freshly generated code
      const effectiveMasterCode =
        existingTeam.master_code && existingTeam.master_code.startsWith(charPrefix) && existingTeam.master_code.length === 10
          ? existingTeam.master_code
          : masterCode;

      let updatePayload: Record<string, unknown> = {
        round1_answer: formattedAnswer,
        first_digit: charPrefix,
        master_code: effectiveMasterCode,
        current_level: 2,
        started_at: startedAt,
        completed_level1_at: now,
        updated_at: now,
      };

      let updateQuery = supabase.from("teams").update(updatePayload);

      if (teamId) {
        updateQuery = updateQuery.eq("id", teamId);
      } else {
        updateQuery = updateQuery.eq("team_code", teamCode);
      }

      let { data: updatedTeam, error } = await updateQuery.select().single();

      // Schema resilience fallback: if first_digit column in Supabase is still INT (pending migration),
      // update without first_digit so master_code (which preserves the letter at index 0) is saved safely!
      if (error) {
        console.warn("submit-round1 initial update error, retrying with fallback payload:", error.message);
        const fallbackPayload = {
          round1_answer: formattedAnswer,
          master_code: effectiveMasterCode,
          current_level: 2,
          started_at: startedAt,
          completed_level1_at: now,
          updated_at: now,
        };
        let retryQuery = supabase.from("teams").update(fallbackPayload);
        if (teamId) {
          retryQuery = retryQuery.eq("id", teamId);
        } else {
          retryQuery = retryQuery.eq("team_code", teamCode);
        }
        const retryResult = await retryQuery.select().single();
        if (retryResult.data) {
          updatedTeam = retryResult.data;
          error = null;
        } else {
          error = retryResult.error;
        }
      }

      if (error || !updatedTeam) {
        console.error("submit-round1 db error:", error);
        return NextResponse.json({ error: "Failed to update team progress" }, { status: 500 });
      }

      // Return masked master code to participant (first character visible, 9 asterisks)
      const maskedMasterCode = charPrefix + "*********";
      const safeTeam = { ...updatedTeam, master_code: maskedMasterCode, first_digit: charPrefix };

      return NextResponse.json({
        success: true,
        currentLevel: 2,
        levelCleared: true,
        maskedMasterCode,
        team: safeTeam,
        serverTime: now,
      });
    } else {
      // Local dev fallback
      const teams = getLocalTeams();
      const team = teams.find((t) => t.id === teamId || t.team_code === teamCode);

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      // Prevent state downgrade or master code tampering if Round 1 is already cleared
      if (team.current_level >= 2 && team.master_code) {
        const maskedMasterCode = team.master_code.slice(0, 1) + "*********";
        const safeTeam = { ...team, master_code: maskedMasterCode };
        return NextResponse.json({
          success: true,
          currentLevel: team.current_level,
          levelCleared: true,
          maskedMasterCode,
          team: safeTeam,
          serverTime: now,
        });
      }

      // START TIMER HERE: Set started_at only when master key is generated!
      if (!team.started_at) {
        team.started_at = now;
      }
      const effectiveMasterCode =
        team.master_code && team.master_code.startsWith(charPrefix) && team.master_code.length === 10
          ? team.master_code
          : masterCode;

      team.round1_answer = formattedAnswer;
      team.first_digit = charPrefix;
      team.master_code = effectiveMasterCode;
      team.current_level = 2;
      team.completed_level1_at = now;

      const maskedMasterCode = charPrefix + "*********";
      const safeTeam = { ...team, master_code: maskedMasterCode };

      return NextResponse.json({
        success: true,
        currentLevel: 2,
        levelCleared: true,
        maskedMasterCode,
        team: safeTeam,
        serverTime: now,
      });
    }
  } catch (err: unknown) {
    console.error("submit-round1 error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
