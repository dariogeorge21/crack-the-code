import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseConfigured, getLocalTeams, setLocalTeams, Team } from "@/lib/supabase";

function generateUnique3DigitCodes(count: number): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    // Generate a 3-digit number between 100 and 999
    const code = Math.floor(100 + Math.random() * 900).toString();
    codes.add(code);
  }
  return Array.from(codes);
}

export async function POST() {
  try {
    const codes = generateUnique3DigitCodes(11);
    const updatedTeams: Team[] = [];

    if (isSupabaseConfigured()) {
      const supabase = getAdminSupabase()!;

      for (let i = 1; i <= 11; i++) {
        const teamNumber = i;
        const teamName = `Team ${i < 10 ? "0" : ""}${i}`;
        const teamCode = codes[i - 1];

        const { data, error } = await supabase
          .from("teams")
          .upsert(
            {
              team_number: teamNumber,
              team_name: teamName,
              team_code: teamCode,
              current_level: 1,
              started_at: null,
              round1_answer: null,
              first_digit: null,
              master_code: null,
              completed_level1_at: null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "team_number" }
          )
          .select()
          .single();

        if (error) {
          console.error(`Error upserting team ${i}:`, error);
        } else if (data) {
          updatedTeams.push(data);
        }
      }
    } else {
      // Local dev fallback
      const localTeams: Team[] = [];
      for (let i = 1; i <= 11; i++) {
        localTeams.push({
          id: i.toString(),
          team_number: i,
          team_name: `Team ${i < 10 ? "0" : ""}${i}`,
          team_code: codes[i - 1],
          current_level: 1,
          started_at: null,
          round1_answer: null,
          first_digit: null,
          master_code: null,
          completed_level1_at: null,
        });
      }
      setLocalTeams(localTeams);
      updatedTeams.push(...localTeams);
    }

    return NextResponse.json({
      success: true,
      message: "11 teams generated with unique 3-digit codes successfully",
      teams: updatedTeams.sort((a, b) => a.team_number - b.team_number),
    });
  } catch (err: unknown) {
    console.error("generate-teams error:", err);
    return NextResponse.json({ error: "Failed to generate teams" }, { status: 500 });
  }
}
