import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured, getLocalTeams, Team } from "@/lib/supabase";

function computeMaskedMasterCode(masterCode: string | null, firstDigit: number | null, currentLevel: number): string | null {
  if (!masterCode && firstDigit === null) return null;
  const full = masterCode || (firstDigit !== null ? `${firstDigit}000000000` : "");
  if (!full) return null;

  if (currentLevel >= 3) {
    return full.slice(0, 3) + "*******";
  } else if (currentLevel >= 2 || firstDigit !== null) {
    return full.slice(0, 1) + "*********";
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const trimmedCode = code.trim();

    // Reject flushed / placeholder reset codes
    if (trimmedCode.startsWith("RESET") || trimmedCode.startsWith("FLUSH") || trimmedCode === "null" || trimmedCode === "") {
      return NextResponse.json({ error: "ACCESS DENIED: TEAM CODES HAVE BEEN FLUSHED / AWAITING ADMIN GENERATION" }, { status: 403 });
    }

    // Verify Team Code
    if (isSupabaseConfigured()) {
      const supabase = getSupabase()!;
      const { data: team, error } = await supabase
        .from("teams")
        .select("*")
        .eq("team_code", trimmedCode)
        .single();

      if (error || !team) {
        if (error?.code === "42P01") {
          const teams = getLocalTeams();
          const localTeam = teams.find((t) => t.team_code === trimmedCode);
          if (localTeam) {
            const maskedCode = computeMaskedMasterCode(localTeam.master_code, localTeam.first_digit, localTeam.current_level);
            return NextResponse.json({ success: true, team: { ...localTeam, master_code: maskedCode } });
          }
        }
        return NextResponse.json({ error: "ACCESS DENIED: INVALID TEAM CODE" }, { status: 404 });
      }

      // Check if code was flushed in DB
      if (team.team_code.startsWith("RESET") || team.team_code.startsWith("FLUSH")) {
        return NextResponse.json({ error: "ACCESS DENIED: TEAM CODES HAVE BEEN FLUSHED // CONTACT CENTRAL COMMAND" }, { status: 403 });
      }

      const serverTime = new Date().toISOString();
      const maskedCode = computeMaskedMasterCode(team.master_code, team.first_digit, team.current_level);
      return NextResponse.json({ 
        success: true, 
        team: { ...team, master_code: maskedCode },
        serverTime
      });
    } else {
      // Local dev fallback
      const teams = getLocalTeams();
      const team = teams.find((t) => t.team_code === trimmedCode);

      if (!team || team.team_code.startsWith("RESET") || team.team_code.startsWith("FLUSH")) {
        return NextResponse.json({ error: "ACCESS DENIED: INVALID OR FLUSHED TEAM CODE" }, { status: 404 });
      }

      const serverTime = new Date().toISOString();
      const maskedCode = computeMaskedMasterCode(team.master_code, team.first_digit, team.current_level);
      return NextResponse.json({ 
        success: true, 
        team: { ...team, master_code: maskedCode },
        serverTime
      });
    }
  } catch (err: unknown) {
    console.error("verify-code error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
