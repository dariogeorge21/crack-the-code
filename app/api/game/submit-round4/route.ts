import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabase, isSupabaseConfigured, getLocalTeams, appendLevelSplit, extractLevelSplits } from "@/lib/supabase";
import { formatDuration } from "@/lib/time";
import { Team } from "@/types";

// ==============================================================================
// VIBE-SECURITY AUDIT: SERVER-SIDE FLAG VERIFICATION & ANTI-BRUTE FORCE
// Flag: "Luxar-Converge" (Never leaked to client bundle or network responses)
// Hashes stored server-side only:
// SHA-256 for "Luxar-Converge": 7fe4c549da89e70c4eee2b121e4296163b7801783a8f418b4f178dbabebae051
// SHA-256 for "luxar-converge": 9cfb34d95b5c9077ee8bbce847425fdb5fb8040bc1f4db3b7c8449c25f4a7cfa
// ==============================================================================
const VALID_FLAG_HASHES = new Set([
  "7fe4c549da89e70c4eee2b121e4296163b7801783a8f418b4f178dbabebae051",
  "9cfb34d95b5c9077ee8bbce847425fdb5fb8040bc1f4db3b7c8449c25f4a7cfa",
]);

// In-Memory Rate Limiting for flag brute force prevention
interface RateLimitRecord {
  failedAttempts: number;
  lockedUntil: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

function checkRateLimit(key: string): { allowed: boolean; remainingLockoutSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  if (!record) return { allowed: true, remainingLockoutSeconds: 0 };

  if (record.lockedUntil > now) {
    return {
      allowed: false,
      remainingLockoutSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  // Lockout expired, reset attempts
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    rateLimitStore.delete(key);
  }

  return { allowed: true, remainingLockoutSeconds: 0 };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { failedAttempts: 0, lockedUntil: 0 };
  record.failedAttempts += 1;

  if (record.failedAttempts >= 5) {
    // 30 seconds lockout after 5 failed flag submissions
    record.lockedUntil = now + 30 * 1000;
  }

  rateLimitStore.set(key, record);
}

function clearRateLimit(key: string) {
  rateLimitStore.delete(key);
}

// Helper to compute a team's total duration for ranking
function computeTeamTotalTime(team: Team): number {
  if (!team.started_at) return Infinity;
  const startMs = new Date(team.started_at).getTime();
  const { completedLevel2At, completedLevel3At, completedLevel4At } = extractLevelSplits(team.round1_answer);
  const effectiveL4 = team.completed_level4_at || completedLevel4At;
  if (effectiveL4) {
    return Math.max(0, Math.floor((new Date(effectiveL4).getTime() - startMs) / 1000));
  }
  const effectiveL3 = team.completed_level3_at || completedLevel3At;
  if (effectiveL3) {
    return Math.max(0, Math.floor((new Date(effectiveL3).getTime() - startMs) / 1000));
  }
  return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
}

export async function POST(req: Request) {
  try {
    const { teamCode, flag } = await req.json();

    if (!teamCode || typeof teamCode !== "string") {
      return NextResponse.json({ error: "teamCode is required" }, { status: 400 });
    }

    const trimmedCode = teamCode.trim();
    const rateLimitKey = `flag_submit_${trimmedCode}`;

    // 1. Rate Limiting Check
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `RATE LIMIT EXCEEDED // Too many failed attempts. Security lockout active for ${rateLimit.remainingLockoutSeconds}s.`,
        },
        { status: 429 }
      );
    }

    if (!flag || typeof flag !== "string" || !flag.trim()) {
      return NextResponse.json({ error: "Flag input is required" }, { status: 400 });
    }

    const cleanedFlag = flag.trim();
    const flagHash = crypto.createHash("sha256").update(cleanedFlag).digest("hex");
    const flagHashLower = crypto.createHash("sha256").update(cleanedFlag.toLowerCase()).digest("hex");

    // 2. Timing-Safe / Cryptographic Hash Verification
    const isCorrectFlag = VALID_FLAG_HASHES.has(flagHash) || VALID_FLAG_HASHES.has(flagHashLower);

    if (!isCorrectFlag) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        {
          error: "INVALID FLAG // Decryption sequence failed. Verify the flag string from target site.",
        },
        { status: 400 }
      );
    }

    // Flag is correct: clear rate limit counter
    clearRateLimit(rateLimitKey);

    const now = new Date().toISOString();
    const nowMs = new Date(now).getTime();

    // 3. Update Progress & Calculate Telemetry
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

      if (team.current_level < 4) {
        return NextResponse.json(
          { error: "ACCESS DENIED: Must clear Round 3 before accessing Final Lock." },
          { status: 403 }
        );
      }

      // Ensure team has a valid 10-digit master_code
      let fullMasterCode = team.master_code;
      if (!fullMasterCode || fullMasterCode.length < 10) {
        const prefix = team.first_digit !== null && team.first_digit !== undefined ? team.first_digit.toString() : "0";
        let rest = "";
        while (prefix.length + rest.length < 10) {
          rest += Math.floor(Math.random() * 10).toString();
        }
        fullMasterCode = (prefix + rest).slice(0, 10);
      }

      // Check if already cleared Level 4 / Finished
      const { completedLevel2At, completedLevel3At, completedLevel4At } = extractLevelSplits(team.round1_answer);
      const effectiveL2At = team.completed_level2_at || completedLevel2At || null;
      const effectiveL3At = team.completed_level3_at || completedLevel3At || null;
      const effectiveL4At = team.completed_level4_at || completedLevel4At || null;

      const completionTime = effectiveL4At || now;
      const completionMs = new Date(completionTime).getTime();

      // Compute split times
      let l1Seconds: number | null = null;
      let l2Seconds: number | null = null;
      let l3Seconds: number | null = null;
      let l4Seconds: number | null = null;
      let totalSeconds: number | null = null;

      if (team.started_at) {
        const startMs = new Date(team.started_at).getTime();
        const l1Ms = team.completed_level1_at ? new Date(team.completed_level1_at).getTime() : startMs;
        l1Seconds = Math.max(0, Math.floor((l1Ms - startMs) / 1000));

        const l2Ms = effectiveL2At ? new Date(effectiveL2At).getTime() : l1Ms;
        l2Seconds = Math.max(0, Math.floor((l2Ms - l1Ms) / 1000));

        const l3Ms = effectiveL3At ? new Date(effectiveL3At).getTime() : l2Ms;
        l3Seconds = Math.max(0, Math.floor((l3Ms - l2Ms) / 1000));

        l4Seconds = Math.max(0, Math.floor((completionMs - l3Ms) / 1000));
        totalSeconds = l1Seconds + l2Seconds + l3Seconds + l4Seconds;
      }

      // Update team if not yet marked level 5
      let updatedTeam = team;
      if (team.current_level < 5 || !effectiveL4At) {
        const updatedRound1Answer = appendLevelSplit(team.round1_answer, 4, now);
        const updatePayload: Record<string, unknown> = {
          master_code: fullMasterCode,
          current_level: 5,
          round1_answer: updatedRound1Answer,
          completed_level4_at: now,
          updated_at: now,
        };

        const { data: dbUpdated, error: updateErr } = await supabase
          .from("teams")
          .update(updatePayload)
          .eq("team_code", trimmedCode)
          .select()
          .single();

        if (updateErr) {
          // Schema fallback if completed_level4_at column is not yet present
          const fallbackPayload = {
            master_code: fullMasterCode,
            current_level: 5,
            round1_answer: updatedRound1Answer,
            updated_at: now,
          };
          const retry = await supabase
            .from("teams")
            .update(fallbackPayload)
            .eq("team_code", trimmedCode)
            .select()
            .single();

          if (retry.error || !retry.data) {
            console.error("submit-round4 db update error:", updateErr);
            return NextResponse.json({ error: "Failed to save completion state" }, { status: 500 });
          }
          updatedTeam = retry.data;
        } else if (dbUpdated) {
          updatedTeam = dbUpdated;
        }
      }

      // 4. Calculate Rank among finished teams
      const { data: allTeams } = await supabase
        .from("teams")
        .select("*");

      const finishedTeams = (allTeams || []).filter(
        (t) => t.current_level >= 5 || t.completed_level4_at || (t.round1_answer && t.round1_answer.includes("[L4:"))
      );

      finishedTeams.sort((a, b) => {
        const tA = computeTeamTotalTime(a);
        const tB = computeTeamTotalTime(b);
        return tA - tB;
      });

      const teamRankIndex = finishedTeams.findIndex((t) => t.team_code === trimmedCode);
      const rank = teamRankIndex >= 0 ? teamRankIndex + 1 : 1;

      const { cleanAnswer } = extractLevelSplits(updatedTeam.round1_answer);
      const safeTeam = {
        ...updatedTeam,
        round1_answer: cleanAnswer,
        master_code: fullMasterCode,
        completed_level2_at: effectiveL2At,
        completed_level3_at: effectiveL3At,
        completed_level4_at: completionTime,
      };

      return NextResponse.json({
        success: true,
        currentLevel: 5,
        levelCleared: true,
        rank,
        totalTimeFormatted: totalSeconds !== null ? formatDuration(totalSeconds) : "--",
        totalSeconds,
        masterCode: fullMasterCode,
        unlockedCount: 10,
        team: safeTeam,
        completed_level4_at: completionTime,
        splitTime: {
          l1Seconds,
          l1Formatted: l1Seconds !== null ? formatDuration(l1Seconds) : null,
          l2Seconds,
          l2Formatted: l2Seconds !== null ? formatDuration(l2Seconds) : null,
          l3Seconds,
          l3Formatted: l3Seconds !== null ? formatDuration(l3Seconds) : null,
          l4Seconds,
          l4Formatted: l4Seconds !== null ? formatDuration(l4Seconds) : null,
          totalSeconds,
          totalFormatted: totalSeconds !== null ? formatDuration(totalSeconds) : null,
        },
      });
    } else {
      // Local dev fallback
      const teams = getLocalTeams();
      const team = teams.find((t) => t.team_code === trimmedCode);

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      if (team.current_level < 4) {
        return NextResponse.json(
          { error: "ACCESS DENIED: Must clear Round 3 before accessing Final Lock." },
          { status: 403 }
        );
      }

      let fullMasterCode = team.master_code;
      if (!fullMasterCode || fullMasterCode.length < 10) {
        const prefix = team.first_digit !== null && team.first_digit !== undefined ? team.first_digit.toString() : "0";
        let rest = "";
        while (prefix.length + rest.length < 10) {
          rest += Math.floor(Math.random() * 10).toString();
        }
        fullMasterCode = (prefix + rest).slice(0, 10);
      }

      const { completedLevel2At, completedLevel3At, completedLevel4At } = extractLevelSplits(team.round1_answer);
      const effectiveL2At = team.completed_level2_at || completedLevel2At || null;
      const effectiveL3At = team.completed_level3_at || completedLevel3At || null;
      const effectiveL4At = team.completed_level4_at || completedLevel4At || null;

      const completionTime = effectiveL4At || now;
      const completionMs = new Date(completionTime).getTime();

      let l1Seconds: number | null = null;
      let l2Seconds: number | null = null;
      let l3Seconds: number | null = null;
      let l4Seconds: number | null = null;
      let totalSeconds: number | null = null;

      if (team.started_at) {
        const startMs = new Date(team.started_at).getTime();
        const l1Ms = team.completed_level1_at ? new Date(team.completed_level1_at).getTime() : startMs;
        l1Seconds = Math.max(0, Math.floor((l1Ms - startMs) / 1000));

        const l2Ms = effectiveL2At ? new Date(effectiveL2At).getTime() : l1Ms;
        l2Seconds = Math.max(0, Math.floor((l2Ms - l1Ms) / 1000));

        const l3Ms = effectiveL3At ? new Date(effectiveL3At).getTime() : l2Ms;
        l3Seconds = Math.max(0, Math.floor((l3Ms - l2Ms) / 1000));

        l4Seconds = Math.max(0, Math.floor((completionMs - l3Ms) / 1000));
        totalSeconds = l1Seconds + l2Seconds + l3Seconds + l4Seconds;
      }

      if (team.current_level < 5 || !team.completed_level4_at) {
        team.current_level = 5;
        team.master_code = fullMasterCode;
        team.round1_answer = appendLevelSplit(team.round1_answer, 4, now);
        team.completed_level4_at = now;
        team.updated_at = now;
      }

      // Rank among finished teams
      const finishedTeams = teams.filter(
        (t) => t.current_level >= 5 || t.completed_level4_at || (t.round1_answer && t.round1_answer.includes("[L4:"))
      );

      finishedTeams.sort((a, b) => {
        const tA = computeTeamTotalTime(a);
        const tB = computeTeamTotalTime(b);
        return tA - tB;
      });

      const teamRankIndex = finishedTeams.findIndex((t) => t.team_code === trimmedCode);
      const rank = teamRankIndex >= 0 ? teamRankIndex + 1 : 1;

      const { cleanAnswer } = extractLevelSplits(team.round1_answer);
      const safeTeam = {
        ...team,
        round1_answer: cleanAnswer,
        master_code: fullMasterCode,
        completed_level2_at: effectiveL2At,
        completed_level3_at: effectiveL3At,
        completed_level4_at: completionTime,
      };

      return NextResponse.json({
        success: true,
        currentLevel: 5,
        levelCleared: true,
        rank,
        totalTimeFormatted: totalSeconds !== null ? formatDuration(totalSeconds) : "--",
        totalSeconds,
        masterCode: fullMasterCode,
        unlockedCount: 10,
        team: safeTeam,
        completed_level4_at: completionTime,
        splitTime: {
          l1Seconds,
          l1Formatted: l1Seconds !== null ? formatDuration(l1Seconds) : null,
          l2Seconds,
          l2Formatted: l2Seconds !== null ? formatDuration(l2Seconds) : null,
          l3Seconds,
          l3Formatted: l3Seconds !== null ? formatDuration(l3Seconds) : null,
          l4Seconds,
          l4Formatted: l4Seconds !== null ? formatDuration(l4Seconds) : null,
          totalSeconds,
          totalFormatted: totalSeconds !== null ? formatDuration(totalSeconds) : null,
        },
      });
    }
  } catch (err: unknown) {
    console.error("submit-round4 error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
