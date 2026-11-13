// src/app/api/tags/[tagId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { TagService } from "@/domains/tags/tag.service";
import { updateTagSchema, toSafeTagDTO } from "@/domains/tags/tag.dto";
import { ApiError } from "@/lib/errors";

interface RouteParams {
  params: { tagId: string };
}

const tagService = new TagService();

// PATCH - rename a tag (the slug is re-derived)
export const PATCH = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const parsed = updateTagSchema.safeParse(body);
    if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0].message);

    const tag = await tagService.renameTag(params.tagId, parsed.data, tenantId);
    return NextResponse.json({
      success: true,
      message: "Tag renamed successfully.",
      data: toSafeTagDTO(tag),
    });
  },
);

// DELETE - remove a tag (its resource links cascade away with it)
export const DELETE = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    await tagService.deleteTag(params.tagId, tenantId);
    return NextResponse.json({ success: true, message: "Tag deleted successfully." });
  },
);
