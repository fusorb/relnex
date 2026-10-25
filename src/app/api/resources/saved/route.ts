// src/app/api/resources/saved/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { ResourceService } from "@/domains/resources";

const resourceService = new ResourceService();

// GET — list all resources saved/bookmarked by the authenticated user,
// scoped to their current tenant. Ordered by savedAt descending (most recent first).
export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const saved = await resourceService.listSavedResources(
    session.userId,
    tenantId,
  );
  return NextResponse.json({ success: true, data: saved });
});
