// src/app/api/auth/logout/route.ts
// Logout is stateless - we clear the cookie on the client.
// POST (not GET) to prevent logout via prefetch or image tags (CSRF hygiene).
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { clearAuthCookies } from "@/core/auth";

export const POST = handleApiRoute(async (_req: NextRequest) => {
  await clearAuthCookies();

  return NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });
});
