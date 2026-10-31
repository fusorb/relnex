// src/app/api/resources/[resourceId]/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { flowExecutor } from "@/core/flows";
import { trackUsageFlow } from "@/domains/resources";

interface RouteParams {
  params: { resourceId: string };
}

// POST - fire-and-forget telemetry. No auth guard by design:
// anonymous VIEW and OPEN events are legitimate and common.
// userId is read from an optional x-user-id header (set by your auth middleware
// when the user IS logged in, so it can be attributed without requiring auth).
// Returns 202 Accepted - the client should not wait on this response.
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const userId = req.headers.get("x-user-id") ?? null;
    const body = await req.json();
    await flowExecutor.run(
      trackUsageFlow,
      { resourceId: params.resourceId, ...body },
      { userId, identityId: null, tenantId },
    );
    return NextResponse.json({ success: true }, { status: 202 });
  },
);
