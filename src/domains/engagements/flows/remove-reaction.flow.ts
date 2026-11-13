import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ReactionService } from "../reaction.service";
import { ResourceRepository } from "@/domains/resources";

const Input = z.object({
  resourceId: z.string(),
  type:       z.enum(["LIKE"]).optional(),
});

export interface RemoveReactionResult {
  removed: boolean;
}

export const removeReactionFlow: Flow<z.infer<typeof Input>, RemoveReactionResult> = {
  name:        "engagement:remove-reaction",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new ReactionService(ctx.db);
    await service.removeReaction(ctx.userId!, input.resourceId, input.type ?? "LIKE");
    await new ResourceRepository(ctx.db).adjustMetric(input.resourceId, "likes", -1);
    return { removed: true };
  },
};
