// src/app/api/resources/[resourceId]/children/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { getSession } from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { getChildrenFlow } from "@/domains/resources";

interface RouteParams {
  params: { resourceId: string };
}

// Public endpoint: anyone may browse a resource's children, but the flow hides
// private/draft children from non-owners (optional auth decides what you see).
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await getSession(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
    const viewerId = session?.userId ?? null;
    const result = await flowExecutor.run(
      getChildrenFlow,
      { resourceId: params.resourceId, page, limit, viewerId },
      { userId: viewerId, identityId: session?.identityId ?? null, tenantId },
    );
    return NextResponse.json({ success: true, data: result });
  },
);
