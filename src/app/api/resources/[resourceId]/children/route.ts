// src/app/api/resources/[resourceId]/children/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { flowExecutor } from "@/core/flows";
import { getChildrenFlow } from "@/domains/resources";

interface RouteParams {
  params: { resourceId: string };
}

// Public — resource children are scoped by tenantId only; no auth required.
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
    const result = await flowExecutor.run(
      getChildrenFlow,
      { resourceId: params.resourceId, page, limit },
      { tenantId },
    );
    return NextResponse.json({ success: true, data: result });
  },
);
