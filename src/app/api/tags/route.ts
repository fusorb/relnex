// src/app/api/tags/route.ts
// FIX: TagService was being instantiated inside each handler - moved to module scope.
// FIX: import path normalised to @/lib/auth/guards (consistent with all other routes).
// Tags are simple reference data - no FlowExecutor needed for these operations.
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { TagService } from "@/domains/tags/tag.service";
import { createTagSchema, toSafeTagDTO } from "@/domains/tags/tag.dto";
import { ApiError } from "@/lib/errors";

const tagService = new TagService();

export const GET = handleApiRoute(async (req: NextRequest) => {
  await requireOnboarded(req);
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const allTags = await tagService.getAllTags(tenantId);
  return NextResponse.json({
    success: true,
    count: allTags.length,
    data: allTags.map(toSafeTagDTO),
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
