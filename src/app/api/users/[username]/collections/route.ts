// src/app/api/users/[username]/collections/route.ts
// Optional auth: owners see all collections; others see PUBLIC + UNLISTED only.
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { getSession } from "@/core/auth";
import { UserService } from "@/domains/users";

interface RouteParams { params: { username: string } }

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest, { params }: RouteParams) => {
  const session = await getSession(req);
  const collections = await userService.getUserNestedCollections(
    params.username,
    session?.userId ?? null,
  );
  return NextResponse.json({ success: true, data: collections });
});
