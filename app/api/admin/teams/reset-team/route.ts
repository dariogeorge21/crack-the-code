import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseConfigured, resetLocalTeam, findLocalTeam } from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth/admin";

export async function POST(req: Request) {
  try {
    const isAuthorized = await verifyAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: Admin session required" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { teamId, teamNumber, teamCode } = body;

    const identifier = teamId || (teamNumber !== undefined ? String(teamNumber) : "") || teamCode;
    if (!identifier) {
      return NextResponse.json(
        { error: "Team identifier (teamId, teamNumber, or teamCode) is required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getAdminSupabase()!;

      // Find the team first
      let findQuery = supabase.from("teams").select("*");
      if (teamId) {
        findQuery = findQuery.eq("id", teamId);
      } else if (teamNumber !== undefined) {
        findQuery = findQuery.eq("team_number", Number(teamNumber));
      } else {
        findQuery = findQuery.eq("team_code", String(teamCode).trim());
      }

      const { data: team, error: findErr } = await findQuery.single();
      if (findErr || !team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      // Fetch all other teams' codes to guarantee the new code is unique across all teams
      const { data: allTeams } = await supabase
        .from("teams")
        .select("id, team_number, team_code");

      const existingCodes = new Set(
        (allTeams || [])
          .filter((t) => t.id !== team.id && t.team_number !== team.team_number)
          .map((t) => t.team_code)
          .filter(Boolean)
      );

      // Generate a fresh, unique 3-digit code (100 - 999)
      let newTeamCode = "";
      do {
        newTeamCode = Math.floor(100 + Math.random() * 900).toString();
      } while (
        existingCodes.has(newTeamCode) ||
        newTeamCode.startsWith("RESET") ||
        newTeamCode.startsWith("FLUSH")
      );

      // Base reset payload (Strictly wipes all progress and sets new team_code)
      const basePayload: Record<string, unknown> = {
        team_code: newTeamCode,
        current_level: 1,
        started_at: null,
        round1_answer: null, // Cleans all embedded [L2:..], [L3:..], [L4:..] splits
        first_digit: null,
        master_code: null,
        completed_level1_at: null,
        updated_at: now,
      };

      // Try updating with optional migration columns
      let updateError = null;
      let updatedTeam = null;

      try {
        const fullPayload = {
          ...basePayload,
          completed_level2_at: null,
          completed_level3_at: null,
          completed_level4_at: null,
        };

        const res = await supabase
          .from("teams")
          .update(fullPayload)
          .eq("id", team.id)
          .select()
          .single();

        if (res.error) {
          updateError = res.error;
        } else {
          updatedTeam = res.data;
        }
      } catch (err) {
        updateError = err;
      }

      // If optional column update failed, fallback to base payload
      if (updateError || !updatedTeam) {
        const res = await supabase
          .from("teams")
          .update(basePayload)
          .eq("id", team.id)
          .select()
          .single();

        if (res.error || !res.data) {
          console.error("reset-team db update error:", res.error || updateError);
          return NextResponse.json({ error: "Failed to reset team progress" }, { status: 500 });
        }
        updatedTeam = res.data;
      }

      // Keep local in-memory dev store in sync with the exact same new code
      resetLocalTeam(team.id || team.team_number, newTeamCode);

      return NextResponse.json({
        success: true,
        message: `Team ${updatedTeam.team_name} (T-${updatedTeam.team_number}) has been reset to Level 1. Fresh Access Code: ${newTeamCode}`,
        team: updatedTeam,
        newTeamCode,
        previousTeamCode: team.team_code,
      });
    } else {
      // Local dev fallback
      const localTeam = findLocalTeam(identifier);
      if (!localTeam) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      const previousCode = localTeam.team_code;
      const updatedTeam = resetLocalTeam(localTeam.id);

      return NextResponse.json({
        success: true,
        message: `Team ${localTeam.team_name} (T-${localTeam.team_number}) has been reset to Level 1. Fresh Access Code: ${updatedTeam?.team_code}`,
        team: updatedTeam,
        newTeamCode: updatedTeam?.team_code,
        previousTeamCode: previousCode,
      });
    }
  } catch (err: unknown) {
    console.error("reset-team route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
