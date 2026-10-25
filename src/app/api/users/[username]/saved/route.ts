// src/app/api/users/[username]/saved/route.ts
// Auth required — saved resources are private to their owner.
// The service enforces the ownership check and throws 403 for mismatches.
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireAuth } from "@/core/auth";
import { UserService } from "@/domains/users";

interface RouteParams { params: { username: string } }

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest, { params }: RouteParams) => {
  const session = await requireAuth(req);
  const saved = await userService.getUserNestedSaved(
    params.username,
    session.userId,
  );
  return NextResponse.json({ success: true, data: saved });
});