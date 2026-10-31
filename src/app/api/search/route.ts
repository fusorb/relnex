// src/app/api/search/route.ts - unified search across resources, users, collections
//
// Examples:
//   GET /api/search?q=typescript           → all three entities
//   GET /api/search?q=typescript&entity=resource&type=ARTICLE
//   GET /api/search?q=john&entity=user
//   GET /api/search?q=design&entity=collection
//   GET /api/search?q=react&entity=resource&tagId=<uuid>&page=2&limit=20
//
// No auth required - results are scoped to tenant and only surface
// PUBLISHED resources + PUBLIC collections.

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, ApiError } from "@/lib/errors";
import { SearchService } from "@/domains/search/search.service";
import { unifiedSearchSchema } from "@/domains/search/search.dto";

const searchService = new SearchService();

export const GET = handleApiRoute(async (req: NextRequest) => {
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const { searchParams } = new URL(req.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parsed = unifiedSearchSchema.safeParse(rawParams);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const result = await searchService.executeUnifiedQuery(parsed.data, tenantId);

  return NextResponse.json({ success: true, data: result });
});