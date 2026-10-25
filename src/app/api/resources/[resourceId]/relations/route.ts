// src/app/api/resources/[resourceId]/relations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { connectResourcesFlow, disconnectResourcesFlow, type ConnectResourcesInput } from "@/domains/resources";

interface RouteParams {
  params: { resourceId: string };
}

// POST — add a directed relation from [resourceId] to body.targetId
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const result = await flowExecutor.run(
      connectResourcesFlow,
      { resourceId: params.resourceId, ...body },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json(
      { success: true, data: result.relation },
      { status: 201 },
    );
  },
);

// DELETE — remove a specific typed relation; body carries { targetId, type }
export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const result = await flowExecutor.run(
      disconnectResourcesFlow,
      { resourceId: params.resourceId, targetId: body.targetId ?? body.toId, type: body.type },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result });
  },
);
