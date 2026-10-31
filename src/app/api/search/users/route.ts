// src/app/api/search/users/route.ts
// User directory search — for @mention lookups, user discovery, etc.
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, ApiError } from "@/lib/errors";
import { SearchRepository } from "@/domains/search/search.repository";
import { toUserSearchResultDTO } from "@/domains/search/search.dto";
import { z } from "zod";

const schema = z.object({
  q: z.string().default(""),
  limit: z.string().regex(/^\d+$/).optional().default("20"),
  page: z.string().regex(/^\d+$/).optional().default("1"),
}).strict();

const repo = new SearchRepository();

export const GET = handleApiRoute(async (req: NextRequest) => {
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0].message);

  const limit = parseInt(parsed.data.limit, 10);
  const page = parseInt(parsed.data.page, 10);
  const skip = (page - 1) * limit;

  const { total, items } = await repo.searchUsers(parsed.data.q, {
    q: parsed.data.q,
    type: "users",
    page,
    limit,
    tenantId,
  });

  return NextResponse.json({
    success: true,
    data: {
      items: items.map(toUserSearchResultDTO),
      pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
    },
  });
});