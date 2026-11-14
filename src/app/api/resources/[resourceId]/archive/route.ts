import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { ResourceService, toSafeResourceDTO } from "@/domains/resources";

interface RouteParams {
  params: {
    resourceId: string;
  };
}

const resourceService = new ResourceService();

export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const { resourceId } = params;

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

export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const { resourceId } = params;

    const unarchivedResource = await resourceService.unarchiveResource(
      resourceId,
      session.userId,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      message: "Resource unarchived.",
      data: toSafeResourceDTO(unarchivedResource),
    });
  },
);
