import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  signAdminToken,
  verifyAdminAuth,
  timingSafeStringCompare,
  getAdminCookieOptions,
} from "@/lib/auth/admin";

interface AdminRateLimitState {
  failedAttempts: number;
  lockoutCount: number;
  lockoutUntil: number; // Unix epoch ms
}

declare global {
  // eslint-disable-next-line no-var
  var __ADMIN_AUTH_RATE_LIMITS: Map<string, AdminRateLimitState> | undefined;
}

const MAX_FAILED_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes in ms (300,000 ms)

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

function getRateLimitState(ip: string): AdminRateLimitState {
  if (!globalThis.__ADMIN_AUTH_RATE_LIMITS) {
    globalThis.__ADMIN_AUTH_RATE_LIMITS = new Map();
  }
  let state = globalThis.__ADMIN_AUTH_RATE_LIMITS.get(ip);
  if (!state) {
    state = {
      failedAttempts: 0,
      lockoutCount: 0,
      lockoutUntil: 0,
    };
    globalThis.__ADMIN_AUTH_RATE_LIMITS.set(ip, state);
  }
  return state;
}

// GET: Query current session auth status & IP lockout status
export async function GET(req: Request) {
  const isAuthenticated = await verifyAdminAuth(req);
  if (isAuthenticated) {
    return NextResponse.json({
      authenticated: true,
      lockedOut: false,
      remainingSeconds: 0,
      attemptsRemaining: MAX_FAILED_ATTEMPTS,
    });
  }

  const ip = getClientIp(req);
  const state = getRateLimitState(ip);
  const now = Date.now();

  if (state.lockoutUntil > now) {
    const remainingSeconds = Math.ceil((state.lockoutUntil - now) / 1000);
    return NextResponse.json({
      authenticated: false,
      lockedOut: true,
      remainingSeconds,
      lockoutMinutes: Math.ceil(remainingSeconds / 60),
      attemptsRemaining: 0,
    });
  }

  return NextResponse.json({
    authenticated: false,
    lockedOut: false,
    remainingSeconds: 0,
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - state.failedAttempts),
  });
}

// POST: Authenticate admin password with timing-safe comparison and set HttpOnly session cookie
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const state = getRateLimitState(ip);
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

    const { password } = await req.json();
    const expectedPassword = process.env.ADMIN_PASSWORD || "csea1to4";

    // 2. Validate Password with Timing-Safe Comparison
    const isValid =
      typeof password === "string" &&
      timingSafeStringCompare(password.trim(), expectedPassword);

    if (isValid) {
      // SUCCESS: Reset lockout state for this IP
      state.failedAttempts = 0;
      state.lockoutCount = 0;
      state.lockoutUntil = 0;

      // Create signed session token
      const sessionToken = signAdminToken();

      const response = NextResponse.json({
        success: true,
        role: "admin",
        token: sessionToken,
      });

      // Set tamper-proof HttpOnly session cookie
      response.cookies.set(
        ADMIN_COOKIE_NAME,
        sessionToken,
        getAdminCookieOptions(undefined, req)
      );

      return response;
    }

    // 3. FAILED ATTEMPT: Increment counter
    state.failedAttempts += 1;

    if (state.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      // Exponential lockout formula: 5m * 2^(lockoutCount)
      const currentMultiplier = Math.pow(2, state.lockoutCount);
      const lockoutDurationMs = BASE_LOCKOUT_MS * currentMultiplier;
      const lockoutDurationMins = 5 * currentMultiplier;

      state.lockoutUntil = now + lockoutDurationMs;
      state.lockoutCount += 1;
      state.failedAttempts = 0;

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

// DELETE: Logout by clearing the admin session cookie
export async function DELETE(req: Request) {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    ...getAdminCookieOptions(0, req),
    maxAge: 0,
  });
  return response;
}
