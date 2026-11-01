import { z }        from "zod";
import type { Flow } from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { CollectionService }    from "../collection.service";
import { CollectionRepository } from "../collection.repository";
import { ApiError } from "@/lib/errors";
import { resolveTenantId } from "@/core/tenancy";

const Input = z.object({ collectionId: z.string(), resourceId: z.string() });

export const addResourceToCollectionFlow: Flow<z.infer<typeof Input>> = {
  name: "collection:add-resource", inputSchema: Input,
  async execute(input, ctx) {
    const service = new CollectionService(ctx.db);
    await service.assertOwnership(input.collectionId, ctx.userId!, ctx.tenantId);

    const resource = await ctx.db.resource.findFirst({ where: { id: input.resourceId, deletedAt: null } });
    if (!resource) throw ApiError.notFound("Resource not found");

    const repo       = new CollectionRepository(ctx.db);
    const maxIndex   = await repo.getMaxOrderIndex(input.collectionId);

    const entry = await ctx.db.collectionResource.upsert({
      where:  { collectionId_resourceId: { collectionId: input.collectionId, resourceId: input.resourceId } },
      create: { collectionId: input.collectionId, resourceId: input.resourceId, orderIndex: maxIndex + 1, tenantId: resolveTenantId(ctx.tenantId) },
      update: {},
    });

    return { entry };
  },
};
