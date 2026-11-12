import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import type { Prisma }   from "@prisma-client";
import { ResourceService } from "../resource.service";

const Input = z.object({
  resourceId: z.string(),
  page:       z.number().default(1),
  limit:      z.number().default(20),
  viewerId:   z.string().nullable().optional(),
});

export const getChildrenFlow: Flow<z.infer<typeof Input>> = {
  name:        "resource:get-children",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const service = new ResourceService(ctx.db);
    // The parent must itself be visible to the caller, or this 404s.
    const parent = await service.assertVisible(input.resourceId, input.viewerId, ctx.tenantId);
    const isOwner = input.viewerId != null && parent.authorId === input.viewerId;

    // Anyone may browse a resource's children, but only the owner sees private
    // or draft ones - everyone else gets published PUBLIC/UNLISTED children.
    const visible: Prisma.ResourceWhereInput = {
      visibility: { in: ["PUBLIC", "UNLISTED"] },
      status: "PUBLISHED",
    };
    const where: Prisma.ResourceWhereInput = {
      parentId:  input.resourceId,
      deletedAt: null,
      ...(isOwner ? {} : visible),
    };

    const [children, total] = await Promise.all([
      ctx.db.resource.findMany({
        where,
        include: { author: true, metrics: true },
        orderBy: { createdAt: "asc" },
        skip:    (input.page - 1) * input.limit,
        take:    input.limit,
      }),
      ctx.db.resource.count({ where }),
    ]);

    return { children, total, page: input.page, limit: input.limit };
  },
};
