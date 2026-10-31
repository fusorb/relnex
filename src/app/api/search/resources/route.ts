// src/app/api/search/resources/route.ts
// Dedicated resource search - full pagination metadata.
// Useful when the UI has a full search page focused on resources only.
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, ApiError } from "@/lib/errors";
import { SearchService } from "@/domains/search/search.service";
import { resourceSearchSchema } from "@/domains/search/search.dto";

const searchService = new SearchService();

export const GET = handleApiRoute(async (req: NextRequest) => {
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const { searchParams } = new URL(req.url);
  const parsed = resourceSearchSchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0].message);
  const result = await searchService.executeResourceQuery(parsed.data, tenantId);
  return NextResponse.json({ success: true, data: result });
});