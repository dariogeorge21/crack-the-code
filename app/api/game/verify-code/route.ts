import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured, getLocalTeams, Team, extractLevelSplits } from "@/lib/supabase";
import { computeMaskedMasterCode } from "@/lib/code-masking";

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
            const serverTime = new Date().toISOString();
            if (!localTeam.started_at) {
              localTeam.started_at = serverTime;
            }
            const { cleanAnswer, completedLevel2At, completedLevel3At, completedLevel4At } = extractLevelSplits(localTeam.round1_answer);
            const maskedCode = computeMaskedMasterCode(localTeam.master_code, localTeam.first_digit, localTeam.current_level);
            return NextResponse.json({
              success: true,
              team: {
                ...localTeam,
                master_code: maskedCode,
                round1_answer: cleanAnswer,
                completed_level2_at: localTeam.completed_level2_at || completedLevel2At || null,
                completed_level3_at: localTeam.completed_level3_at || completedLevel3At || null,
                completed_level4_at: localTeam.completed_level4_at || completedLevel4At || null,
              },
              serverTime,
            });
          }
        }
        return NextResponse.json({ error: "ACCESS DENIED: INVALID TEAM CODE" }, { status: 404 });
      }

      // Check if code was flushed in DB
      if (team.team_code.startsWith("RESET") || team.team_code.startsWith("FLUSH")) {
        return NextResponse.json({ error: "ACCESS DENIED: TEAM CODES HAVE BEEN FLUSHED // CONTACT CENTRAL COMMAND" }, { status: 403 });
      }

      const serverTime = new Date().toISOString();

      // Anchor started_at upon initial login so Round 1 duration is properly recorded!
      if (!team.started_at) {
        const { error: startErr } = await supabase
          .from("teams")
          .update({ started_at: serverTime })
          .eq("id", team.id);
        if (!startErr) {
          team.started_at = serverTime;
        }
      }

      const { cleanAnswer, completedLevel2At, completedLevel3At, completedLevel4At } = extractLevelSplits(team.round1_answer);
      const maskedCode = computeMaskedMasterCode(team.master_code, team.first_digit, team.current_level);

      return NextResponse.json({ 
        success: true, 
        team: { 
          ...team, 
          master_code: maskedCode,
          round1_answer: cleanAnswer,
          completed_level2_at: team.completed_level2_at || completedLevel2At || null,
          completed_level3_at: team.completed_level3_at || completedLevel3At || null,
          completed_level4_at: team.completed_level4_at || completedLevel4At || null,
        },
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

      // Anchor started_at upon initial login
      if (!team.started_at) {
        team.started_at = serverTime;
      }

      const { cleanAnswer, completedLevel2At, completedLevel3At, completedLevel4At } = extractLevelSplits(team.round1_answer);
      const maskedCode = computeMaskedMasterCode(team.master_code, team.first_digit, team.current_level);

      return NextResponse.json({ 
        success: true, 
        team: { 
          ...team, 
          master_code: maskedCode,
          round1_answer: cleanAnswer,
          completed_level2_at: team.completed_level2_at || completedLevel2At || null,
          completed_level3_at: team.completed_level3_at || completedLevel3At || null,
          completed_level4_at: team.completed_level4_at || completedLevel4At || null,
        },
        serverTime
      });
    }
  } catch (err: unknown) {
    console.error("verify-code error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
