import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured, getLocalTeams } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { teamId, teamCode, round1Answer, firstDigit } = await req.json();

    if (!round1Answer || typeof round1Answer !== "string" || !round1Answer.trim()) {
      return NextResponse.json({ error: "Round 1 answer is required" }, { status: 400 });
    }

    const formattedAnswer = round1Answer.trim().toUpperCase();

    if (firstDigit === undefined || firstDigit === null || isNaN(Number(firstDigit))) {
      return NextResponse.json({ error: "First number of code is required" }, { status: 400 });
    }

    const digitNum = parseInt(firstDigit.toString(), 10);
    if (digitNum < 0 || digitNum > 9) {
      return NextResponse.json({ error: "First number must be locked to a single digit (0-9)" }, { status: 400 });
    }

    const digitPrefix = digitNum.toString();

    // Generate 10-digit integer code starting with the team's input first number
    const remainingCount = Math.max(0, 10 - digitPrefix.length);
    let remainingDigits = "";
    for (let i = 0; i < remainingCount; i++) {
      remainingDigits += Math.floor(Math.random() * 10).toString();
    }
    const masterCode = (digitPrefix + remainingDigits).slice(0, 10);

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

      let updateQuery = supabase.from("teams").update({
        round1_answer: formattedAnswer,
        first_digit: digitNum,
        master_code: masterCode,
        current_level: 2,
        started_at: startedAt,
        completed_level1_at: now,
        updated_at: now,
      });

      if (teamId) {
        updateQuery = updateQuery.eq("id", teamId);
      } else {
        updateQuery = updateQuery.eq("team_code", teamCode);
      }

      const { data: updatedTeam, error } = await updateQuery.select().single();

      if (error || !updatedTeam) {
        console.error("submit-round1 db error:", error);
        return NextResponse.json({ error: "Failed to update team progress" }, { status: 500 });
      }

      // Return masked master code to participant (first digit visible, 9 asterisks)
      const maskedMasterCode = digitPrefix + "*********";
      const safeTeam = { ...updatedTeam, master_code: maskedMasterCode };

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
      team.round1_answer = formattedAnswer;
      team.first_digit = digitNum;
      team.master_code = masterCode;
      team.current_level = 2;
      team.completed_level1_at = now;

      const maskedMasterCode = digitPrefix + "*********";
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
