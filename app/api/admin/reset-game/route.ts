import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseConfigured, triggerLocalReset } from "@/lib/supabase";
import { TOTAL_TEAMS } from "@/constants";
import { verifyAdminAuth } from "@/lib/auth/admin";

export async function POST() {
  try {
    const isAuthorized = await verifyAdminAuth();
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: Admin session required" },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getAdminSupabase()!;

      // 1. Reset all teams, flush master keys and flush team codes in parallel
      await Promise.all(
        Array.from({ length: TOTAL_TEAMS }, (_, idx) => {
          const teamNum = idx + 1;
          const placeholderCode = `RESET_${teamNum < 10 ? "0" : ""}${teamNum}`;
          return supabase
            .from("teams")
            .update({
              current_level: 1,
              team_code: placeholderCode, // Flushed! Old 3-digit codes destroyed
              started_at: null, // Timer cleared
              round1_answer: null,
              first_digit: null,
              master_code: null, // Flushed!
              completed_level1_at: null,
              completed_level2_at: null,
              completed_level3_at: null,
              completed_level4_at: null,
              updated_at: now,
            })
            .eq("team_number", teamNum);
        })
      );

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
