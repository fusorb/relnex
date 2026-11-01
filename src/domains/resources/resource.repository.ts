import type { DbClient }   from "@/core/flows/flow-context";
import type { Prisma }     from "@prisma-client";
import type { ListResourcesInput } from "./resource.dto";

export class ResourceRepository {
  constructor(private db: DbClient) {}

  async findById(id: string, tenantId?: string | null) {
    return this.db.resource.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}), deletedAt: null },
      include: { author: true, metrics: true, resourceTags: { include: { tag: true } } },
    });
  }

  async findBySlug(slug: string, authorId: string, tenantId?: string | null) {
    return this.db.resource.findFirst({
      where: { slug, authorId, ...(tenantId ? { tenantId } : {}), deletedAt: null },
    });
  }

  async findMany(params: ListResourcesInput) {
    const where: Prisma.ResourceWhereInput = {
      deletedAt: null,
      ...(params.type       ? { type: params.type }           : {}),
      ...(params.status     ? { status: params.status }       : {}),
      ...(params.visibility ? { visibility: params.visibility } : {}),
      ...(params.authorId   ? { authorId: params.authorId }   : {}),
      ...(params.tenantId   ? { tenantId: params.tenantId }   : {}),
    };

    const [items, total] = await Promise.all([
      this.db.resource.findMany({
        where,
        include: { author: true, metrics: true, resourceTags: { include: { tag: true } } },
        orderBy: { createdAt: "desc" },
        skip:    (params.page  - 1) * params.limit,
        take:    params.limit,
      }),
      this.db.resource.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }

  async create(data: Prisma.ResourceCreateInput) {
    return this.db.resource.create({ data, include: { author: true } });
  }

  async update(id: string, data: Prisma.ResourceUpdateInput) {
    return this.db.resource.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.db.resource.update({
      where: { id },
      data:  { deletedAt: new Date(), status: "DELETED" },
    });
  }

  async incrementMetric(resourceId: string, field: "views" | "opens" | "downloads" | "shares" | "likes" | "bookmarks" | "comments") {
    const m = await this.db.resourceMetrics.upsert({
      where:  { resourceId },
      create: { resourceId, [field]: 1 },
      update: { [field]: { increment: 1 } },
    });

    // Derived engagement score (weighted counters), kept in sync on every event.
    const engagementScore =
      m.views + m.opens + m.downloads + m.shares + m.likes * 2 + m.bookmarks * 3 + m.comments * 4;
    if (m.engagementScore !== engagementScore) {
      await this.db.resourceMetrics.update({ where: { resourceId }, data: { engagementScore } });
    }
  }

  async attachTags(resourceId: string, tagIds: string[]) {
    await this.db.resourceTag.createMany({
      data: tagIds.map((tagId) => ({ resourceId, tagId })),
      skipDuplicates: true,
    });
  }

  async detachTags(resourceId: string, tagIds: string[]) {
    await this.db.resourceTag.deleteMany({
      where: { resourceId, tagId: { in: tagIds } },
    });
  }

  async listVersions(resourceId: string, tenantId?: string | null) {
    return this.db.resourceVersion.findMany({
      where: { resource: { id: resourceId, deletedAt: null, ...(tenantId && { tenantId }) } },
      orderBy: { versionNumber: "desc" },
    });
  }

  async listSavedResources(userId: string, tenantId?: string | null) {
    return this.db.savedResource.findMany({
      where: {
        userId,
        resource: { deletedAt: null, ...(tenantId && { tenantId }) },
      },
      include: { resource: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
