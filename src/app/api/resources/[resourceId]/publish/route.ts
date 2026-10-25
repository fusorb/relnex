// src/app/api/resources/[resourceId]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute }    from "@/lib/errors";
import { requireOnboarded }   from "@/core/auth";
import { flowExecutor }       from "@/core/flows";
import { publishResourceFlow } from "@/domains/resources";

interface RouteParams {
  params: { resourceId: string };
}

// POST /api/resources/[resourceId]/publish
// Separate from PATCH to make publish an explicit, intentional action — not
// just another field update. Enforces the full publish contract via the flow.
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const result = await flowExecutor.run(
      publishResourceFlow,
      { resourceId: params.resourceId },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result.resource });
  },
);
