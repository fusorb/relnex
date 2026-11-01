import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { ResourceRepository } from "../resource.repository";
import { resolveTenantId }    from "@/core/tenancy";

const Input = z.object({
  resourceId: z.string(),
  event:      z.enum(["VIEW","OPEN","DOWNLOAD","SHARE","LIKE","BOOKMARK"]),
  sessionId:  z.string().optional(),
  metadata:   z.record(z.string(), z.any()).optional(),
});

const EVENT_METRIC_MAP = {
  VIEW:     "views",
  OPEN:     "opens",
  DOWNLOAD: "downloads",
  SHARE:    "shares",
  LIKE:     "likes",
  BOOKMARK: "bookmarks",
} as const;

export const trackUsageFlow: Flow<z.infer<typeof Input>> = {
  name:        "resource:track-usage",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    await ctx.db.resourceUsage.create({
      data: {
        resourceId: input.resourceId,
        actorId:    ctx.userId!,
        event:      input.event,
        sessionId:  input.sessionId,
        metadata:   input.metadata,
        tenantId:   resolveTenantId(ctx.tenantId),
      },
    });

    const repo = new ResourceRepository(ctx.db);
    await repo.incrementMetric(input.resourceId, EVENT_METRIC_MAP[input.event]);

    return {};
  },
};
