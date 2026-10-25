// src/app/api/users/[username]/route.ts — public profile (no auth required)
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { UserService } from "@/domains/users";

interface RouteParams { params: { username: string } }

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest, { params }: RouteParams) => {
  const profile = await userService.getPublicProfile(params.username);
  return NextResponse.json({ success: true, data: profile });
});
