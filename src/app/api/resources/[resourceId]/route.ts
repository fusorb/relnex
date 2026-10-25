// src/app/api/resources/[resourceId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute }     from "@/lib/errors";
import { requireOnboarded }    from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { updateResourceFlow, deleteResourceFlow, ResourceService } from "@/domains/resources";

interface RouteParams {
  params: { resourceId: string };
}

const resourceService = new ResourceService();

export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const resource = await resourceService.getResource(params.resourceId, tenantId);
    return NextResponse.json({ success: true, data: resource });
  },
);

export const PATCH = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const result = await flowExecutor.run(
      updateResourceFlow,
      { resourceId: params.resourceId, ...body },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result.resource });
  },
);

export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const result = await flowExecutor.run(
      deleteResourceFlow,
      { resourceId: params.resourceId },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result });
  },
);
