// src/app/api/resources/[resourceId]/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { saveResourceFlow, unsaveResourceFlow } from "@/domains/resources";

interface RouteParams {
  params: { resourceId: string };
}

// POST - bookmark/save this resource for the authenticated user
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const result = await flowExecutor.run(
      saveResourceFlow,
      { resourceId: params.resourceId },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  },
);

// DELETE - remove bookmark
export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const result = await flowExecutor.run(
      unsaveResourceFlow,
      { resourceId: params.resourceId },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result });
  },
);
