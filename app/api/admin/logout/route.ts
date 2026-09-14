import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminCookieOptions } from "@/lib/auth/admin";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Admin session ended successfully",
  });

  // Expire the admin session cookie immediately
  response.cookies.set(ADMIN_COOKIE_NAME, "", getAdminCookieOptions(0));

  return response;
}
