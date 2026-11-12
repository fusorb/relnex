import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ResourceService }   from "../resource.service";
import { ResourceRepository } from "../resource.repository";
import { resolveTenantId }    from "@/core/tenancy";

const Input = z.object({ resourceId: z.string() });

export const saveResourceFlow: Flow<z.infer<typeof Input>> = {
  name:        "resource:save",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new ResourceService(ctx.db);
    // You can only bookmark a resource you are allowed to read.
    await service.assertVisible(input.resourceId, ctx.userId, ctx.tenantId);

    await ctx.db.savedResource.upsert({
      where:  { userId_resourceId: { userId: ctx.userId!, resourceId: input.resourceId } },
      create: { userId: ctx.userId!, resourceId: input.resourceId, tenantId: resolveTenantId(ctx.tenantId) },
      update: {},
    });

    const repo = new ResourceRepository(ctx.db);
    await repo.incrementMetric(input.resourceId, "bookmarks");

    return {};
  },
};
