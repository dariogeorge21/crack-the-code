import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured, getLocalResetTime } from "@/lib/supabase";

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase()!;
      const { data } = await supabase
        .from("game_state")
        .select("last_reset_at")
        .eq("id", 1)
        .single();

      return NextResponse.json({
        lastResetAt: data?.last_reset_at || new Date().toISOString(),
      });
    }

    return NextResponse.json({
      lastResetAt: getLocalResetTime(),
    });
  } catch (err: unknown) {
    console.error("game status error:", err);
    return NextResponse.json({ lastResetAt: new Date().toISOString() });
  }
}
