// src/app/api/comments/[commentId]/replies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { CommentService } from "@/domains/comments";

interface RouteParams {
  params: { commentId: string };
}

const commentService = new CommentService();

// GET - direct children of a comment (one level deep, chronological ascending).
// Creating a reply goes to POST /comments (with parentId in body) - not here.
// This endpoint is read-only.
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const replies = await commentService.getReplies(params.commentId);
    return NextResponse.json({ success: true, data: replies });
  },
);
