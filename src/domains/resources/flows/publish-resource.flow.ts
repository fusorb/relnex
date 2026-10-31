import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import type { Prisma }   from "@prisma-client";
import { ResourceService }   from "../resource.service";
import { ResourceRepository } from "../resource.repository";
import { ApiError } from "@/lib/errors";

const Input = z.object({
  resourceId:           z.string(),
  publishedContentJson: z.record(z.string(), z.any()).optional(),
});

export const publishResourceFlow: Flow<z.infer<typeof Input>, { resource: unknown }> = {
  name:        "resource:publish",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new ResourceService(ctx.db);
    const resource = await service.assertOwnership(input.resourceId, ctx.userId!, ctx.tenantId);

    if (resource.status === "DELETED") throw ApiError.badRequest("Cannot publish a deleted resource");

    const repo = new ResourceRepository(ctx.db);
    const publishedContentJson = (
      input.publishedContentJson ?? resource.draftContentJson ?? undefined
    ) as Prisma.InputJsonValue | undefined;

    const updated = await repo.update(input.resourceId, {
      status:               "PUBLISHED",
      publishedAt:          new Date(),
      publishedContentJson,
    });

    return { resource: updated };
  },
};
