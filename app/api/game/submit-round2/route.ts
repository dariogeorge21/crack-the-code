import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured, getLocalTeams } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { teamCode, accessCode } = await req.json();

    if (!teamCode || typeof teamCode !== "string") {
      return NextResponse.json({ error: "teamCode is required" }, { status: 400 });
    }

    const trimmedCode = teamCode.trim();

    // Verify Access Code is exactly 41
    const cleanAccessCode = (accessCode || "").toString().trim();
    if (cleanAccessCode !== "41") {
      return NextResponse.json(
        { error: "INVALID ACCESS CODE. Expected 41 (Screened: 4, Waiting: 1)." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

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

      const { data: updatedTeam, error: updateErr } = await supabase
        .from("teams")
        .update({
          master_code: fullMasterCode,
          current_level: nextLevel,
          updated_at: now,
        })
        .eq("team_code", trimmedCode)
        .select()
        .single();

      if (updateErr || !updatedTeam) {
        console.error("submit-round2 db update error:", updateErr);
        return NextResponse.json({ error: "Failed to update team progress" }, { status: 500 });
      }

      const safeTeam = { ...updatedTeam, master_code: newMaskedCode };

      return NextResponse.json({
        success: true,
        currentLevel: nextLevel,
        levelCleared: true,
        revealedDigits: newDigits,
        unlockedCount: 3,
        maskedMasterCode: newMaskedCode,
        team: safeTeam,
        serverTime: now,
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
      team.master_code = fullMasterCode;
      team.current_level = nextLevel;
      if (!team.completed_level2_at) {
        team.completed_level2_at = now;
      }

      const safeTeam = { ...team, master_code: newMaskedCode };

      return NextResponse.json({
        success: true,
        currentLevel: nextLevel,
        levelCleared: true,
        revealedDigits: newDigits,
        unlockedCount: 3,
        maskedMasterCode: newMaskedCode,
        team: safeTeam,
        serverTime: now,
      });
    }
  } catch (err: unknown) {
    console.error("submit-round2 error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
