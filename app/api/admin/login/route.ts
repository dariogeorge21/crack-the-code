import { NextResponse } from "next/server";

interface AdminRateLimitState {
  failedAttempts: number;
  lockoutCount: number;
  lockoutUntil: number; // Unix epoch ms
}

declare global {
  // eslint-disable-next-line no-var
  var __ADMIN_AUTH_RATE_LIMIT: AdminRateLimitState | undefined;
}

const MAX_FAILED_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes in ms (300,000 ms)

function getRateLimitState(): AdminRateLimitState {
  if (!globalThis.__ADMIN_AUTH_RATE_LIMIT) {
    globalThis.__ADMIN_AUTH_RATE_LIMIT = {
      failedAttempts: 0,
      lockoutCount: 0,
      lockoutUntil: 0,
    };
  }
  return globalThis.__ADMIN_AUTH_RATE_LIMIT;
}

// GET: Query current lockout status and attempts remaining
export async function GET() {
  const state = getRateLimitState();
  const now = Date.now();

  if (state.lockoutUntil > now) {
    const remainingSeconds = Math.ceil((state.lockoutUntil - now) / 1000);
    return NextResponse.json({
      lockedOut: true,
      remainingSeconds,
      lockoutMinutes: Math.ceil(remainingSeconds / 60),
      attemptsRemaining: 0,
    });
  }

  return NextResponse.json({
    lockedOut: false,
    remainingSeconds: 0,
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - state.failedAttempts),
  });
}

// POST: Authenticate admin password with exponential lockout
export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const state = getRateLimitState();
    const now = Date.now();

    // 1. Check if currently in lockout period
    if (state.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((state.lockoutUntil - now) / 1000);
      const remainingMins = Math.ceil(remainingSeconds / 60);
      return NextResponse.json(
        {
          error: `SECURITY LOCKOUT ACTIVE // Try again in ${remainingMins} min (${remainingSeconds}s)`,
          lockedOut: true,
          remainingSeconds,
          attemptsRemaining: 0,
        },
        { status: 429 }
      );
    }

    const expectedPassword = process.env.ADMIN_PASSWORD || "csea1to4";

    // 2. Validate Password
    if (password && typeof password === "string" && password.trim() === expectedPassword) {
      // SUCCESS: Reset all lockout states
      state.failedAttempts = 0;
      state.lockoutCount = 0;
      state.lockoutUntil = 0;

      return NextResponse.json({
        success: true,
        role: "admin",
        token: "admin_authorized_asthra_session",
      });
    }

    // 3. FAILED ATTEMPT: Increment counter
    state.failedAttempts += 1;

    if (state.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      // Exponential lockout formula: 5m * 2^(lockoutCount)
      // 1st lockout: 5m (300s)
      // 2nd lockout: 10m (600s)
      // 3rd lockout: 20m (1200s)
      // 4th lockout: 40m (2400s)
      const currentMultiplier = Math.pow(2, state.lockoutCount);
      const lockoutDurationMs = BASE_LOCKOUT_MS * currentMultiplier;
      const lockoutDurationMins = 5 * currentMultiplier;

      state.lockoutUntil = now + lockoutDurationMs;
      state.lockoutCount += 1;
      state.failedAttempts = 0; // reset attempts for after lockout expires

      return NextResponse.json(
        {
          error: `5 FAILED ATTEMPTS REACHED // SYSTEM LOCKED OUT FOR ${lockoutDurationMins} MINUTES`,
          lockedOut: true,
          remainingSeconds: Math.ceil(lockoutDurationMs / 1000),
          attemptsRemaining: 0,
        },
        { status: 429 }
      );
    }

    const remaining = MAX_FAILED_ATTEMPTS - state.failedAttempts;
    return NextResponse.json(
      {
        error: `INVALID ADMIN PASSWORD // ${remaining} ATTEMPT${remaining === 1 ? "" : "S"} REMAINING BEFORE LOCKOUT`,
        lockedOut: false,
        attemptsRemaining: remaining,
      },
      { status: 401 }
    );
  } catch (err: unknown) {
    console.error("admin login error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
