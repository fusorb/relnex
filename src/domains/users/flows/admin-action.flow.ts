import { z }        from "zod";
import type { Flow } from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { AdminActionDto }  from "../user.dto";
import { UserRepository }  from "../user.repository";
import { ApiError }        from "@/lib/errors";
import type { Prisma }     from "@prisma-client";

export const adminActionFlow: Flow<z.infer<typeof AdminActionDto>> = {
  name: "user:admin-action", inputSchema: AdminActionDto,
  async execute(input, ctx) {
    // Caller must be ADMIN (checked at route level via scope guard)
    const repo   = new UserRepository(ctx.db);
    const target = await repo.findById(input.targetUserId);
    if (!target) throw ApiError.notFound("Target user not found");

    const ACTION_MAP = {
      BAN:               { deletedAt: new Date() },
      UNBAN:             { deletedAt: null },
      PROMOTE_MODERATOR: { role: "MODERATOR" as const },
      DEMOTE_USER:       { role: "USER" as const },
    };

    const user = await repo.update(input.targetUserId, ACTION_MAP[input.action] as Prisma.UserUpdateInput);
    return { user };
  },
};
