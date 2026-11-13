import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ApiError } from "@/lib/errors";

const Input = z.object({
  commentId: z.string(),
  status:    z.enum(["ACTIVE","HIDDEN","DELETED","ARCHIVED","SPAM"]),
});

export const updateCommentStatusFlow: Flow<z.infer<typeof Input>, { comment: unknown }> = {
  name:        "resource:update-comment-status",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const comment = await ctx.db.comment.findUnique({ where: { id: input.commentId } });
    if (!comment) throw ApiError.notFound("Comment not found");

    // Only author or admin can update
    if (comment.authorId !== ctx.userId!) throw ApiError.forbidden("Cannot modify this comment");

    const updated = await ctx.db.comment.update({
      where: { id: input.commentId },
      data:  { status: input.status, ...(input.status === "DELETED" ? { deletedAt: new Date() } : {}) },
    });

    return { comment: updated };
  },
};
