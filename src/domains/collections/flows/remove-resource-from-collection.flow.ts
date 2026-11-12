import { z }        from "zod";
import type { Flow } from "@/core/flows/flow";
import { CollectionService } from "../collection.service";

const Input = z.object({ collectionId: z.string(), resourceId: z.string() });

export const removeResourceFromCollectionFlow: Flow<z.infer<typeof Input>> = {
  name: "collection:remove-resource", inputSchema: Input,
  async execute(input, ctx) {
    const service = new CollectionService(ctx.db);
    await service.assertOwnership(input.collectionId, ctx.userId!, ctx.tenantId);

    await ctx.db.collectionResource.deleteMany({
      where: { collectionId: input.collectionId, resourceId: input.resourceId },
    });
    return {};
  },
};
