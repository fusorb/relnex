// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, ApiError } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { adminActionFlow } from "@/domains/users";
import { UserService } from "@/domains/users";
import { prisma } from "@/core/db";

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const data = await userService.getUserDirectoryListing(session.tenantId);
  return NextResponse.json({ success: true, data });
});

export const PATCH = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);

  const requester = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!requester || requester.role !== "ADMIN") {
    throw ApiError.forbidden("Administrative authorization required");
  }

  const body = await req.json();
  const { targetUserId, ...actionPayload } = body;
  if (!targetUserId) {
    throw ApiError.badRequest("Missing required field: targetUserId");
  }

  const action = actionPayload.isArchived
    ? "archive"
    : actionPayload.isDeleted
      ? "delete"
      : null;
  if (!action) {
    throw ApiError.badRequest("Specify isArchived or isDeleted");
  }

  const result = await flowExecutor.run(
    adminActionFlow,
    { targetUserId, action, reason: actionPayload.reason ?? "Admin action" },
    { userId: session.userId, identityId: session.identityId, tenantId: session.tenantId },
  );

  return NextResponse.json({ success: true, data: result });
});
