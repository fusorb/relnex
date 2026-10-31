// src/app/api/search/tags/route.ts
// Tag autocomplete - for tag pickers, filter dropdowns, and search suggestions.
// Returns tags whose name OR slug contains the query string.
// No auth required - tags are public reference data.

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, ApiError } from "@/lib/errors";
import { prisma } from "@/core/db";
import { z } from "zod";

const schema = z.object({
  q: z.string().default(""),
  limit: z.string().regex(/^\d+$/).optional().default("20"),
}).strict();

export const GET = handleApiRoute(async (req: NextRequest) => {
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0].message);

  const { q, limit } = parsed.data;
  const take = parseInt(limit, 10);

  const tags = await prisma.tag.findMany({
    where: {
      ...(tenantId !== null && { tenantId }),
      ...(q.trim().length > 0 && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
    take,
  });

  return NextResponse.json({ success: true, data: tags });
});