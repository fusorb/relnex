import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ResourceService }  from "../resource.service";
import { ResourceRepository } from "../resource.repository";
import { resolveTenantId }    from "@/core/tenancy";

const Input = z.object({
  resourceId: z.string(),
  content:    z.string().min(1).max(5000),
  parentId:   z.string().optional(),
});

export const addCommentFlow: Flow<z.infer<typeof Input>, { comment: unknown }> = {
  name:        "resource:add-comment",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new ResourceService(ctx.db);
    // You can only comment on a resource you are allowed to read.
    await service.assertVisible(input.resourceId, ctx.userId, ctx.tenantId);

    const comment = await ctx.db.comment.create({
      data: {
        content:    input.content,
        authorId:   ctx.userId!,
        resourceId: input.resourceId,
        parentId:   input.parentId,
        tenantId:   resolveTenantId(ctx.tenantId),
      },
    });

    const repo = new ResourceRepository(ctx.db);
    await repo.incrementMetric(input.resourceId, "comments");

    return { comment };
  },
};
