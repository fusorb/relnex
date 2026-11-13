// src/app/api/resources/[resourceId]/reactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { addReactionFlow, removeReactionFlow, ReactionService } from "@/domains/engagements";
import { ResourceService } from "@/domains/resources";
import { paginate } from "@/lib/pagination";

interface RouteParams {
  params: { resourceId: string };
}

const resourceService = new ResourceService();
const reactionService = new ReactionService();

// GET - who reacted to this resource (visible resources only)
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50") || 50));

    // 404s unless the caller may read the resource.
    await resourceService.assertVisible(params.resourceId, session.userId, tenantId);

    const { items, total } = await reactionService.listByResource(
      params.resourceId,
      tenantId,
      page,
      limit,
    );
    return NextResponse.json({
      success: true,
      data: paginate(items, total, page, limit),
    });
  },
);

// POST - add the caller's LIKE (idempotent: 201 when new, 200 when already there)
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const result = await flowExecutor.run(
      addReactionFlow,
      { resourceId: params.resourceId },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json(
      { success: true, data: result },
      { status: result.added ? 201 : 200 },
    );
  },
);

// DELETE - remove the caller's LIKE
export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const result = await flowExecutor.run(
      removeReactionFlow,
      { resourceId: params.resourceId },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result });
  },
);
