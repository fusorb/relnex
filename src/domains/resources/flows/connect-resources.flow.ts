import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ConnectResourcesDto } from "../resource.dto";
import { ResourceService }     from "../resource.service";
import { ApiError }            from "@/lib/errors";
import { resolveTenantId }     from "@/core/tenancy";

const Input = ConnectResourcesDto.extend({ resourceId: z.string() });

export const connectResourcesFlow: Flow<z.infer<typeof Input>, { relation: unknown }> = {
  name:        "resource:connect",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new ResourceService(ctx.db);
    await service.assertOwnership(input.resourceId, ctx.userId!, ctx.tenantId);
    await service.assertExists(input.targetId, ctx.tenantId);

    if (input.resourceId === input.targetId) {
      throw ApiError.badRequest("Cannot connect a resource to itself");
    }

    const relation = await ctx.db.relation.upsert({
      where:  { fromId_toId_type: { fromId: input.resourceId, toId: input.targetId, type: input.type } },
      create: { fromId: input.resourceId, toId: input.targetId, type: input.type, metadata: input.metadata, tenantId: resolveTenantId(ctx.tenantId) },
      update: { metadata: input.metadata },
    });

    return { relation };
  },
};
