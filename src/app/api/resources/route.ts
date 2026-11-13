// src/app/api/resources/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { createResourceFlow } from "@/domains/resources";
import { ResourceService } from "@/domains/resources/resource.service";
import { listResourcesSchema } from "@/domains/resources";

const resourceService = new ResourceService();

export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const { searchParams } = new URL(req.url);
  const filters = listResourcesSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );
  const result = await resourceService.listResources(tenantId, filters, session.userId);
  return NextResponse.json({ success: true, data: result });
});

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const body = await req.json();
  const result = await flowExecutor.run(createResourceFlow, body, {
    userId: session.userId,
    identityId: session.identityId,
    tenantId,
  });
  return NextResponse.json(
    { success: true, data: result.resource },
    { status: 201 },
  );
});
