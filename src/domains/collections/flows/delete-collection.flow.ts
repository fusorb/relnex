import { z }        from "zod";
import type { Flow } from "@/core/flows/flow";
import { CollectionService }    from "../collection.service";
import { CollectionRepository } from "../collection.repository";

const Input = z.object({ collectionId: z.string() });

export const deleteCollectionFlow: Flow<z.infer<typeof Input>> = {
  name: "collection:delete", inputSchema: Input,
  async execute(input, ctx) {
    const service = new CollectionService(ctx.db);
    await service.assertOwnership(input.collectionId, ctx.userId!, ctx.tenantId);
    const repo = new CollectionRepository(ctx.db);
    await repo.softDelete(input.collectionId);
    return {};
  },
};
