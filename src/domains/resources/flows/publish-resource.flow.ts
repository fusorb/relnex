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

// Collects all string values from an arbitrary content JSON tree.
function extractText(node: unknown): string {
  if (typeof node === "string") return node + " ";
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (node && typeof node === "object") return Object.values(node).map(extractText).join(" ");
  return "";
}

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

    // Derive reading metrics from the published content.
    const words = extractText(publishedContentJson).trim().split(/\s+/).filter(Boolean).length;
    const estimatedTime = words ? Math.max(1, Math.ceil(words / 200)) : 0;

    const updated = await repo.update(input.resourceId, {
      status:               "PUBLISHED",
      publishedAt:          new Date(),
      publishedContentJson,
      wordCount:            words,
      estimatedTime,
    });

    return { resource: updated };
  },
};
