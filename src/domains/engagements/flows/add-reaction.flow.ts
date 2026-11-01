import { z }            from "zod";
import type { Flow }    from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ReactionService } from "../reaction.service";

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
    const service = new ReactionService(ctx.db);
    const reaction = await service.addReaction(
      ctx.userId!, input.resourceId, input.type ?? "LIKE", ctx.tenantId ?? undefined,
    );
    return { added: true, reactionId: reaction.id };
  },
};
