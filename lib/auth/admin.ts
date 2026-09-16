import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours

declare global {
  // eslint-disable-next-line no-var
  var __ADMIN_SESSION_SECRET: string | undefined;
}

function getSessionSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.trim().length > 0) {
    return process.env.ADMIN_SESSION_SECRET.trim();
  }
  // Deterministic fallback derived from existing admin credentials and salt.
  // Guarantees all serverless instances, worker threads, and processes share the exact same secret
  // even if ADMIN_SESSION_SECRET is omitted from environment variables.
  const salt = "asthra-ctc-admin-hmac-v1-2026-secret-seed";
  const seed = `${process.env.ADMIN_PASSWORD || "csea1to4"}:${process.env.ADMIN_CODE || "18092026"}:${process.env.SUPABASE_SERVICE_ROLE_KEY || "local-asthra-key"}:${salt}`;
  return crypto.createHash("sha256").update(seed).digest("hex");
}

/**
 * Creates a tamper-proof HMAC-signed session token with an epoch timestamp.
 * Format: `<timestamp>.<signature>`
 */
export function signAdminToken(): string {
  const secret = getSessionSecret();
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

/**
 * Verifies the integrity and freshness of a signed admin session token.
 */
export function verifyAdminToken(token?: string | null): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestampStr, providedSignature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Verify expiration (12 hours) with clock skew tolerance (allow up to 60s in the future)
  const now = Date.now();
  const CLOCK_SKEW_TOLERANCE_MS = 60 * 1000; // 60s tolerance for server clock drift
  if (timestamp > now + CLOCK_SKEW_TOLERANCE_MS || now - timestamp > SESSION_MAX_AGE_SECONDS * 1000) {
    return false;
  }

  // Verify HMAC signature
  const secret = getSessionSecret();
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(timestampStr)
    .digest("hex");

  return timingSafeStringCompare(providedSignature, expectedSignature);
}

/**
 * Reads the admin token from incoming request headers (x-admin-token or Authorization)
 * or from the admin_session cookie and verifies it.
 */
export async function verifyAdminAuth(req?: Request): Promise<boolean> {
  try {
    // 1. Check custom token header or Authorization header if request is provided
    if (req) {
      const headerToken =
        req.headers.get("x-admin-token") ||
        req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
      if (headerToken && verifyAdminToken(headerToken)) {
        return true;
      }
    }

    // 2. Fall back to reading cookieStore
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return verifyAdminToken(token);
  } catch {
    return false;
  }
}

/**
 * Timing-safe string comparison that pre-hashes both strings with SHA-256.
 * This guarantees buffers are always exactly 32 bytes, preventing runtime length
 * mismatch errors while eliminating timing side-channel attacks.
 */
export function timingSafeStringCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Returns consistent secure cookie options for admin sessions.
 */
export function getAdminCookieOptions(
  maxAge: number = SESSION_MAX_AGE_SECONDS,
  req?: Request
) {
  let isSecure = process.env.NODE_ENV === "production";
  if (req) {
    const proto = req.headers.get("x-forwarded-proto");
    const host = req.headers.get("host") || "";
    const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    if (proto) {
      isSecure = proto === "https";
    } else if (isLocalhost) {
      isSecure = false;
    }
  }

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
