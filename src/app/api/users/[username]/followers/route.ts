// src/app/api/users/[username]/followers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { FollowService } from "@/domains/engagements";
import { UserService, presentPublicUser } from "@/domains/users";
import { paginate } from "@/lib/pagination";

interface RouteParams {
  params: { username: string };
}

const userService = new UserService();
const followService = new FollowService();

// GET - users following this user
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50") || 50));

    const target = await userService.getUserByUsername(params.username);
    const { items, total } = await followService.listFollowers(target.id, page, limit);
    return NextResponse.json({
      success: true,
      data: paginate(items.map((f) => presentPublicUser(f.follower)), total, page, limit),
    });
  },
);
