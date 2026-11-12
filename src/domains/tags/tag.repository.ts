import type { DbClient } from "@/core/flows/flow-context";
import { resolveTenantId } from "@/core/tenancy";

export class TagRepository {
  constructor(private db: DbClient) {}

  async findAll(tenantId?: string | null, page = 1, limit = 100) {
    const where = { ...(tenantId ? { tenantId } : {}) };
    const [items, total] = await Promise.all([
      this.db.tag.findMany({
        where,
        include: { _count: { select: { resources: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.tag.count({ where }),
    ]);
    return { items, total };
  }

  async upsert(name: string, tenantId?: string | null) {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const tenant = resolveTenantId(tenantId);
    return this.db.tag.upsert({
      where:  { tenantId_slug: { tenantId: tenant, slug } },
      create: { name, slug, tenantId: tenant },
      update: {},
    });
  }
}
