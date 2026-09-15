import { NextResponse } from "next/server";
import {
  getAdminSupabase,
  isSupabaseConfigured,
  revertLocalTeamLevel,
  findLocalTeam,
  removeLevelSplit,
} from "@/lib/supabase";
import { verifyAdminAuth } from "@/lib/auth/admin";

export async function POST(req: Request) {
  try {
    const isAuthorized = await verifyAdminAuth();
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

      const currentLevel = team.current_level;
      if (!currentLevel || currentLevel <= 1) {
        return NextResponse.json(
          { error: `Team ${team.team_name} is already at Level 1 and cannot be reverted further.` },
          { status: 400 }
        );
      }

      const newLevel = currentLevel - 1;
      let payload: Record<string, unknown> = {
        current_level: newLevel,
        updated_at: now,
      };

      if (currentLevel >= 5) {
        payload = {
          ...payload,
          completed_level4_at: null,
          round1_answer: removeLevelSplit(team.round1_answer, 4),
        };
      } else if (currentLevel === 4) {
        payload = {
          ...payload,
          completed_level3_at: null,
          round1_answer: removeLevelSplit(team.round1_answer, 3),
        };
      } else if (currentLevel === 3) {
        payload = {
          ...payload,
          completed_level2_at: null,
          round1_answer: removeLevelSplit(team.round1_answer, 2),
        };
      } else if (currentLevel === 2) {
        payload = {
          ...payload,
          completed_level1_at: null,
          round1_answer: null,
          // master_code and first_digit are preserved!
        };
      }

      // Execute update with resilient column error handling
      let { data: updatedTeam, error: updateErr } = await supabase
        .from("teams")
        .update(payload)
        .eq("id", team.id)
        .select()
        .single();

      if (updateErr) {
        // Fallback: omit optional migration columns if they caused an error
        const fallbackPayload: Record<string, unknown> = {
          current_level: newLevel,
          round1_answer: payload.round1_answer,
          updated_at: now,
        };
        if (currentLevel === 2) {
          fallbackPayload.completed_level1_at = null;
        }

        const retry = await supabase
          .from("teams")
          .update(fallbackPayload)
          .eq("id", team.id)
          .select()
          .single();

        if (retry.error || !retry.data) {
          console.error("revert-level db update error:", updateErr || retry.error);
          return NextResponse.json({ error: "Failed to revert team level" }, { status: 500 });
        }
        updatedTeam = retry.data;
      }

      // Sync local in-memory dev store
      revertLocalTeamLevel(team.id || team.team_number || team.team_code);

      return NextResponse.json({
        success: true,
        message: `Team ${updatedTeam.team_name} (T-${updatedTeam.team_number}) reverted from Tier 0${currentLevel} to Tier 0${newLevel}.`,
        previousLevel: currentLevel,
        currentLevel: newLevel,
        team: updatedTeam,
      });
    } else {
      // Local dev fallback
      const localTeam = findLocalTeam(identifier);
      if (!localTeam) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      const currentLevel = localTeam.current_level;
      if (!currentLevel || currentLevel <= 1) {
        return NextResponse.json(
          { error: `Team ${localTeam.team_name} is already at Level 1 and cannot be reverted further.` },
          { status: 400 }
        );
      }

      const result = revertLocalTeamLevel(localTeam.id);
      if (!result) {
        return NextResponse.json({ error: "Failed to revert team level" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Team ${result.team.team_name} (T-${result.team.team_number}) reverted from Tier 0${result.previousLevel} to Tier 0${result.newLevel}.`,
        previousLevel: result.previousLevel,
        currentLevel: result.newLevel,
        team: result.team,
      });
    }
  } catch (err: unknown) {
    console.error("revert-level route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
