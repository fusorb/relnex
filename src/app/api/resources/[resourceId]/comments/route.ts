// src/app/api/resources/[resourceId]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows";
import { addCommentFlow } from "@/domains/resources";
import { CommentService } from "@/domains/comments/comment.service";

interface RouteParams {
  params: { resourceId: string };
}

const commentService = new CommentService();

// GET - root-level comments for this resource
export const GET = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    await requireOnboarded(req);
    const comments = await commentService.getRootComments(params.resourceId);
    return NextResponse.json({ success: true, data: comments });
  },
);

// POST - create a root-level comment on this resource
export const POST = handleApiRoute(
  async (req: NextRequest, { params }: RouteParams) => {
    const session = await requireOnboarded(req);
    const tenantId = req.headers.get("x-tenant-id") ?? null;
    const body = await req.json();
    const result = await flowExecutor.run(
      addCommentFlow,
      { resourceId: params.resourceId, content: body.content },
      { userId: session.userId, identityId: session.identityId, tenantId },
    );
    return NextResponse.json(
      { success: true, data: result.comment },
      { status: 201 },
    );
  },
);
