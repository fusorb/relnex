import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ResourceService } from "../resource.service";
import { ApiError }        from "@/lib/errors";
import type { Prisma }      from "@prisma-client";

const Input = z.object({
  resourceId:    z.string(),
  changeSummary: z.string().optional(),
});

export const createVersionFlow: Flow<z.infer<typeof Input>> = {
  name:        "resource:create-version",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service  = new ResourceService(ctx.db);
    const resource = await service.assertOwnership(input.resourceId, ctx.userId!, ctx.tenantId);

    const latest = await ctx.db.resourceVersion.findFirst({
      where:   { resourceId: input.resourceId },
      orderBy: { versionNumber: "desc" },
    });

    const versionNumber = (latest?.versionNumber ?? 0) + 1;

    const version = await ctx.db.resourceVersion.create({
      data: {
        resourceId:      input.resourceId,
        authorId:        ctx.userId!,
        versionNumber,
        titleSnapshot:   resource.title ?? "Untitled",
        contentSnapshot: (resource.publishedContentJson ?? resource.draftContentJson) as Prisma.InputJsonValue,
        metadataSnapshot: resource.metadata as Prisma.InputJsonValue,
        changeSummary:   input.changeSummary,
        tenantId:        ctx.tenantId,
      },
    });

    return { version };
  },
};
