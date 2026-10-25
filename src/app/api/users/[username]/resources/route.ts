// src/app/api/users/[username]/resources/route.ts
// Optional auth: authenticated owners see ALL their resources (incl. PRIVATE).
// Unauthenticated / non-owner requestors see PUBLIC + UNLISTED only.
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { getSession } from "@/core/auth";
import { UserService } from "@/domains/users";

interface RouteParams { params: { username: string } }

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest, { params }: RouteParams) => {
  const session = await getSession(req);
  const resources = await userService.getUserNestedResources(
    params.username,
    session?.userId ?? null,
  );
  return NextResponse.json({ success: true, data: resources });
});
