import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ReactionService } from "../reaction.service";
import { ResourceService, ResourceRepository } from "@/domains/resources";

const Input = z.object({
  resourceId: z.string(),
  type:       z.enum(["LIKE"]).optional(),
});

export interface AddReactionResult {
  added: boolean;
  reactionId: string;
}

export const addReactionFlow: Flow<z.infer<typeof Input>, AddReactionResult> = {
  name:        "engagement:add-reaction",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    // You can only react to a resource you are allowed to read (404 otherwise).
    await new ResourceService(ctx.db).assertVisible(input.resourceId, ctx.userId, ctx.tenantId);

    const service = new ReactionService(ctx.db);
    const { reaction, created } = await service.addReaction(
      ctx.userId!, input.resourceId, input.type ?? "LIKE", ctx.tenantId ?? undefined,
    );

    // Only a brand-new reaction moves the counter; a repeat react is a no-op.
    if (created) await new ResourceRepository(ctx.db).adjustMetric(input.resourceId, "likes", 1);

    return { added: created, reactionId: reaction.id };
  },
};
