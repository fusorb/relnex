// src/app/api/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { addCommentFlow } from "@/domains/resources";
import { CommentService } from "@/domains/comments/comment.service";

interface RouteParams {
  params: { commentId: string };
}

const commentService = new CommentService();

// GET - fetch a single comment by ID
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const comment = await commentService.findById(params.commentId);
    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: comment });
  },
);

// POST - create a reply to this comment
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const result = await flowExecutor.run(
      addCommentFlow,
      { ...body, parentId: params.commentId },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json(
      { success: true, data: result.comment },
      { status: 201 },
    );
  },
);
