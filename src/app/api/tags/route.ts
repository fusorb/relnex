// src/app/api/tags/route.ts
// Tags are reference data; read/write go through TagService (module-scope).
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { TagService } from "@/domains/tags/tag.service";
import { createTagSchema, toSafeTagDTO } from "@/domains/tags/tag.dto";
import { paginate } from "@/lib/pagination";
import { ApiError } from "@/lib/errors";

const tagService = new TagService();

export const GET = handleApiRoute(async (req: NextRequest) => {
  await requireOnboarded(req);
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? "100") || 100));
  const { items, total } = await tagService.getAllTags(tenantId, page, limit);
  return NextResponse.json({
    success: true,
    data: paginate(items.map(toSafeTagDTO), total, page, limit),
  });
});

export const POST = handleApiRoute(async (req: NextRequest) => {
  await requireOnboarded(req);
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const body = await req.json();
  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success)
    throw ApiError.badRequest(parsed.error.issues[0].message);
  const tag = await tagService.createTag(parsed.data, tenantId);
  return NextResponse.json(
    {
      success: true,
      message: "Tag created successfully.",
      data: toSafeTagDTO(tag),
    },
    { status: 201 },
  );
});
