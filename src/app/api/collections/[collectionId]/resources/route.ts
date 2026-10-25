// src/app/api/collections/[collectionId]/resources/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { CollectionService, addResourceToCollectionSchema } from "@/domains/collections";
import { ApiError } from "@/lib/errors";

interface RouteParams {
  params: { collectionId: string };
}

export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const { collectionId } = params;

    const body = await req.json();
    const parsed = addResourceToCollectionSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    const collectionService = new CollectionService();
    await collectionService.addResource(
      collectionId,
      parsed.data.resourceId,
      session.userId,
      tenantId,
    );

    return NextResponse.json(
      {
        success: true,
        data: { collectionId, resourceId: parsed.data.resourceId },
      },
      { status: 201 },
    );
  },
);

export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const { collectionId } = params;

    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      throw ApiError.badRequest(
        "Missing required query parameter: 'resourceId'.",
      );
    }

    const collectionService = new CollectionService();
    await collectionService.removeResource(
      collectionId,
      session.userId,
      resourceId,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      data: { collectionId, resourceId },
    });
  },
);
