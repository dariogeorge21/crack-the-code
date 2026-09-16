import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseConfigured, triggerLocalReset } from "@/lib/supabase";
import { TOTAL_TEAMS } from "@/constants";
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

    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getAdminSupabase()!;

      // Base reset payload that is guaranteed to exist in any Supabase schema
      const basePayload = (placeholderCode: string) => ({
        current_level: 1,
        team_code: placeholderCode,
        started_at: null,
        round1_answer: null, // cleans all embedded [L2:..], [L3:..], [L4:..] splits
        first_digit: null,
        master_code: null,
        completed_level1_at: null,
        updated_at: now,
      });

      // Probe whether optional migration columns (completed_level2_at, 3, 4) exist
      let hasMigrationColumns = false;
      try {
        const { error: probeError } = await supabase
          .from("teams")
          .update({
            completed_level2_at: null,
            completed_level3_at: null,
            completed_level4_at: null,
          })
          .eq("team_number", 1);

        hasMigrationColumns = !probeError;
      } catch {
        hasMigrationColumns = false;
      }

      // 1. Reset all teams, flush master keys and flush team codes
      await Promise.all(
        Array.from({ length: TOTAL_TEAMS }, async (_, idx) => {
          const teamNum = idx + 1;
          const placeholderCode = `RESET_${teamNum < 10 ? "0" : ""}${teamNum}`;
          const payload = hasMigrationColumns
            ? {
                ...basePayload(placeholderCode),
                completed_level2_at: null,
                completed_level3_at: null,
                completed_level4_at: null,
              }
            : basePayload(placeholderCode);

          const { error } = await supabase
            .from("teams")
            .update(payload)
            .eq("team_number", teamNum);

          if (error) {
            console.error(`Error updating team ${teamNum}:`, error);
            // Fallback to strict base payload if any error occurred
            await supabase
              .from("teams")
              .update(basePayload(placeholderCode))
              .eq("team_number", teamNum);
          }
        })
      );

      // Always keep local in-memory dev store in sync
      triggerLocalReset();

      // 2. Bump game_state reset timestamp
      await supabase
        .from("game_state")
        .upsert(
          { id: 1, last_reset_at: now },
          { onConflict: "id" }
        );
    } else {
      triggerLocalReset();
    }

    return NextResponse.json({
      success: true,
      message: "GAME HAS BEEN RESET // All participants logged out and levels cleared",
      resetAt: now,
    });
  } catch (err: unknown) {
    console.error("reset-game error:", err);
    return NextResponse.json({ error: "Failed to reset game" }, { status: 500 });
  }
}
