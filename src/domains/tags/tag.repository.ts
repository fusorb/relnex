import type { DbClient } from "@/core/flows/flow-context";
import { resolveTenantId } from "@/core/tenancy";
import { slugify } from "./tag.dto";

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

  async findById(id: string, tenantId?: string | null) {
    return this.db.tag.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: { _count: { select: { resources: true } } },
    });
  }

  /** Used to refuse a rename that collides with an existing name or slug. */
  async findByNameOrSlug(name: string, slug: string, tenantId?: string | null) {
    return this.db.tag.findFirst({
      where: { ...(tenantId ? { tenantId } : {}), OR: [{ name }, { slug }] },
    });
  }

  async upsert(name: string, tenantId?: string | null) {
    const slug = slugify(name);
    const tenant = resolveTenantId(tenantId);
    return this.db.tag.upsert({
      where:  { tenantId_slug: { tenantId: tenant, slug } },
      create: { name, slug, tenantId: tenant },
      update: {},
    });
  }

  async update(id: string, data: { name: string; slug: string }) {
    return this.db.tag.update({
      where: { id },
      data,
      include: { _count: { select: { resources: true } } },
    });
  }

  async delete(id: string) {
    // ResourceTag rows cascade at the database level.
    return this.db.tag.delete({ where: { id } });
  }

  /**
   * Re-points every resource linked to `fromTagId` at `toTagId`, skipping pairs
   * that already exist (the (resourceId, tagId) primary key would reject those).
   */
  async moveLinks(fromTagId: string, toTagId: string) {
    const [alreadyLinked, sourceLinks] = await Promise.all([
      this.db.resourceTag.findMany({ where: { tagId: toTagId }, select: { resourceId: true } }),
      this.db.resourceTag.findMany({ where: { tagId: fromTagId }, select: { resourceId: true } }),
    ]);

    const have = new Set(alreadyLinked.map((r) => r.resourceId));
    const toMove = sourceLinks.map((r) => r.resourceId).filter((id) => !have.has(id));

    if (toMove.length) {
      await this.db.resourceTag.createMany({
        data: toMove.map((resourceId) => ({ resourceId, tagId: toTagId })),
        skipDuplicates: true,
      });
    }
    await this.db.resourceTag.deleteMany({ where: { tagId: fromTagId } });
  }
}
