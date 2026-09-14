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
  if (!globalThis.__ADMIN_SESSION_SECRET) {
    globalThis.__ADMIN_SESSION_SECRET = crypto.randomBytes(32).toString("hex");
  }
  return globalThis.__ADMIN_SESSION_SECRET;
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

  // Verify expiration (12 hours)
  const now = Date.now();
  if (now < timestamp || now - timestamp > SESSION_MAX_AGE_SECONDS * 1000) {
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
 * Reads the admin_session cookie from the incoming request headers and verifies it.
 */
export async function verifyAdminAuth(): Promise<boolean> {
  try {
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
export function getAdminCookieOptions(maxAge: number = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
