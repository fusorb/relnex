// src/app/api/users/[username]/follow/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { FollowService, followUserFlow, unfollowUserFlow } from "@/domains/engagements";
import { UserService } from "@/domains/users";

interface RouteParams {
  params: { username: string };
}

const userService = new UserService();
const followService = new FollowService();

// GET - is the caller following this user?
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const target = await userService.getUserByUsername(params.username);
    const following = await followService.isFollowing(session.userId, target.id);
    return NextResponse.json({ success: true, data: { following } });
  },
);

// POST - follow this user
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const target = await userService.getUserByUsername(params.username);
    const result = await flowExecutor.run(
      followUserFlow,
      { targetUserId: target.id },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  },
);

// DELETE - unfollow this user
export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const target = await userService.getUserByUsername(params.username);
    const result = await flowExecutor.run(
      unfollowUserFlow,
      { targetUserId: target.id },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result });
  },
);
