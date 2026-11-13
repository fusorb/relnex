// src/app/api/tags/[tagId]/merge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { TagService } from "@/domains/tags/tag.service";
import { mergeTagSchema, toSafeTagDTO } from "@/domains/tags/tag.dto";
import { ApiError } from "@/lib/errors";

interface RouteParams {
  params: { tagId: string };
}

const tagService = new TagService();

// POST - merge this tag into another, moving its resource links across
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const parsed = mergeTagSchema.safeParse(body);
    if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0].message);

    const target = await tagService.mergeTags(params.tagId, parsed.data.intoTagId, tenantId);
    return NextResponse.json({
      success: true,
      message: "Tags merged successfully.",
      data: toSafeTagDTO(target),
    });
  },
);
