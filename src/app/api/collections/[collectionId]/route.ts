// src/app/api/collections/[collectionId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { updateCollectionFlow, deleteCollectionFlow, CollectionService } from "@/domains/collections";

interface RouteParams {
  params: { collectionId: string };
}

const collectionService = new CollectionService();

export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const collection = await collectionService.getCollection(
      params.collectionId,
      tenantId,
    );
    return NextResponse.json({ success: true, data: collection });
  },
);

export const PATCH = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const result = await flowExecutor.run(
      updateCollectionFlow,
      { collectionId: params.collectionId, ...body },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result.collection });
  },
);

export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const result = await flowExecutor.run(
      deleteCollectionFlow,
      { collectionId: params.collectionId },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json({ success: true, data: result });
  },
);
