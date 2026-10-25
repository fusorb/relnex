// src/app/api/collections/[collectionId]/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { CollectionService, reorderCollectionSchema } from "@/domains/collections";
import { ApiError } from "@/lib/errors";

interface RouteParams {
  params: { collectionId: string };
}

// POST: Update the order of resources in the collection
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const { collectionId } = params;

    const body = await req.json();
    const parsed = reorderCollectionSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }

    const collectionService = new CollectionService();
    await collectionService.reorderCollectionItems(
      collectionId,
      session.userId,
      parsed.data.orderedItemIds,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      message: "Collection order updated.",
    });
  },
);
