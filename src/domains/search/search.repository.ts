import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import type { SearchInput } from "./search.dto";

export class SearchRepository {
  constructor(private db: DbClient = prisma) {}

  async searchResources(q: string, input: SearchInput) {
    const where = {
      deletedAt: null,
      status:    "PUBLISHED" as const,
      visibility: "PUBLIC"    as const,
      ...(input.tenantId && { tenantId: input.tenantId }),
      OR: [
        { title:       { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ],
    };
    const [items, total] = await Promise.all([
      this.db.resource.findMany({
        where, orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.db.resource.count({ where }),
    ]);
    return { items, total };
  }

  async searchUsers(q: string, input: SearchInput) {
    const where = {
      deletedAt:  null,
      ...(input.tenantId && { tenantId: input.tenantId }),
      OR: [
        { username:      { contains: q, mode: "insensitive" as const } },
        { displayName:   { contains: q, mode: "insensitive" as const } },
      ],
    };
    const [items, total] = await Promise.all([
      this.db.user.findMany({
        where, orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.db.user.count({ where }),
    ]);
    return { items, total };
  }

  async searchCollections(q: string, input: SearchInput) {
    const where = {
      deletedAt:  null,
      visibility: "PUBLIC" as const,
      ...(input.tenantId && { tenantId: input.tenantId }),
      OR: [
        { title:       { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ],
    };
    const [items, total] = await Promise.all([
      this.db.collection.findMany({
        where, orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      this.db.collection.count({ where }),
    ]);
    return { items, total };
  }
}
