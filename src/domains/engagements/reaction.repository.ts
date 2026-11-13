import type { DbClient } from "@/core/flows/flow-context";
import type { ReactionType } from "@prisma-client";
import { resolveTenantId } from "@/core/tenancy";

export class ReactionRepository {
  constructor(private db: DbClient) {}

  async findByUserAndResourceAndType(userId: string, resourceId: string, type: ReactionType) {
    return this.db.reaction.findUnique({
      where: { userId_resourceId_type: { userId, resourceId, type } },
    });
  }

  async findByResource(resourceId: string, tenantId?: string | null, page = 1, limit = 50) {
    const where = { resourceId, ...(tenantId ? { tenantId } : {}) };
    const [items, total] = await Promise.all([
      this.db.reaction.findMany({
        where,
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.reaction.count({ where }),
    ]);
    return { items, total };
  }

  async create(data: { userId: string; resourceId: string; type: ReactionType; tenantId?: string | null }) {
    return this.db.reaction.create({
      data: { ...data, tenantId: resolveTenantId(data.tenantId) },
    });
  }

  async delete(id: string) {
    return this.db.reaction.delete({ where: { id } });
  }
}
