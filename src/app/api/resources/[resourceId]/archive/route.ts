import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { ResourceService, toSafeResourceDTO } from "@/domains/resources";

interface RouteParams {
  params: {
    resourceId: string;
  };
}

export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const { resourceId } = params;

    const resourceService = new ResourceService();
    const archivedResource = await resourceService.archiveResource(
      resourceId,
      session.userId,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      message: "Resource archived.",
      data: toSafeResourceDTO(archivedResource),
    });
  },
);
