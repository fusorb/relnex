import { z }            from "zod";
import type { Flow }    from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { UpdateCollectionDto }  from "../collection.dto";
import { CollectionService }    from "../collection.service";
import { CollectionRepository } from "../collection.repository";

const Input = UpdateCollectionDto.extend({ collectionId: z.string() });

export const updateCollectionFlow: Flow<z.infer<typeof Input>, { collection: unknown }> = {
  name: "collection:update", inputSchema: Input,
  async execute(input, ctx) {
    const { collectionId, ...data } = input;
    const service = new CollectionService(ctx.db);
    await service.assertOwnership(collectionId, ctx.userId!, ctx.tenantId);
    const repo = new CollectionRepository(ctx.db);
    const collection = await repo.update(collectionId, data);
    return { collection };
  },
};
