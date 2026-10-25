// src/app/api/resources/[resourceId]/tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { ResourceService } from "@/domains/resources";
import { associateTagsSchema } from "@/domains/tags/tag.dto";
import { ApiError } from "@/lib/errors";

interface RouteParams {
  params: { resourceId: string };
}

const resourceService = new ResourceService();

export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const tags = await resourceService.getResourceTags(
      params.resourceId,
      tenantId,
    );
    return NextResponse.json({ success: true, count: tags.length, data: tags });
  },
);

export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const parsed = associateTagsSchema.safeParse(body);
    if (!parsed.success)
      throw ApiError.badRequest(parsed.error.issues[0].message);
    await resourceService.attachTags(
      params.resourceId,
      tenantId,
      parsed.data.tagIds,
    );
    return NextResponse.json({
      success: true,
      message: "Tags attached to resource.",
    });
  },
);

export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const parsed = associateTagsSchema.safeParse(body);
    if (!parsed.success)
      throw ApiError.badRequest(parsed.error.issues[0].message);
    await resourceService.detachTags(
      params.resourceId,
      tenantId,
      parsed.data.tagIds,
    );
    return NextResponse.json({
      success: true,
      message: "Tags detached from resource.",
    });
  },
);
