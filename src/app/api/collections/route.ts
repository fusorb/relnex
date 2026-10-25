import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { CollectionService, createCollectionSchema, presentCollectionListItem, toSafeCollectionDTO } from "@/domains/collections";
import { ApiError } from "@/lib/errors";

export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const tenantId = req.headers.get("x-tenant-id") ?? null;

  const collectionService = new CollectionService();
  const collections = await collectionService.getUserCollections(
    session.userId,
    tenantId,
  );

  return NextResponse.json({
    success: true,
    count: collections.length,
    data: collections.map((c) => presentCollectionListItem(c)),
  });
});

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const tenantId = req.headers.get("x-tenant-id") ?? null;

  const body = await req.json();
  const parsed = createCollectionSchema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const collectionService = new CollectionService();
  const created = await collectionService.createCollection(
    session.userId,
    parsed.data,
    tenantId,
  );

  return NextResponse.json(
    {
      success: true,
      data: toSafeCollectionDTO(created),
    },
    { status: 201 },
  );
});
