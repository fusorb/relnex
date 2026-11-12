import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { CollectionService, createCollectionSchema, presentCollectionListItem, toSafeCollectionDTO } from "@/domains/collections";
import { paginate } from "@/lib/pagination";
import { ApiError } from "@/lib/errors";

export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50") || 50));

  const collectionService = new CollectionService();
  const { items, total } = await collectionService.getUserCollections(
    session.userId,
    tenantId,
    page,
    limit,
  );

  return NextResponse.json({
    success: true,
    data: paginate(items.map((c) => presentCollectionListItem(c)), total, page, limit),
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
