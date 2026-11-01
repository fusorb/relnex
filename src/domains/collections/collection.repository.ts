import type { DbClient } from "@/core/flows/flow-context";
import type { Prisma }   from "@prisma-client";

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  archetype: true,
  createdAt: true,
} as const;

export class CollectionRepository {
  constructor(private db: DbClient) {}

  async findById(id: string, tenantId?: string | null) {
    return this.db.collection.findFirst({
      where:   { id, ...(tenantId ? { tenantId } : {}), deletedAt: null },
      include: {
        author: true,
        resources: {
          include: {
            resource: { include: { author: { select: authorSelect }, metrics: true } },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
  }

  async findBySlug(slug: string, authorId: string, tenantId?: string | null) {
    return this.db.collection.findFirst({ where: { slug, authorId, ...(tenantId ? { tenantId } : {}), deletedAt: null } });
  }

  async findByAuthor(authorId: string, tenantId?: string | null) {
    return this.db.collection.findMany({
      where: { authorId, ...(tenantId ? { tenantId } : {}), deletedAt: null },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, archetype: true, createdAt: true } },
        _count: { select: { resources: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: Prisma.CollectionCreateInput) {
    return this.db.collection.create({ data });
  }

  async update(id: string, data: Prisma.CollectionUpdateInput) {
    return this.db.collection.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.db.collection.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getMaxOrderIndex(collectionId: string): Promise<number> {
    const last = await this.db.collectionResource.findFirst({
      where:   { collectionId },
      orderBy: { orderIndex: "desc" },
    });
    return last?.orderIndex ?? -1;
  }

  async removeResourceFromCollection(collectionId: string, resourceId: string) {
    await this.db.collectionResource.deleteMany({
      where: { collectionId, resourceId },
    });
  }

  async reorderResources(collectionId: string, orderedResourceIds: string[]) {
    for (let i = 0; i < orderedResourceIds.length; i++) {
      await this.db.collectionResource.updateMany({
        where: { collectionId, resourceId: orderedResourceIds[i] },
        data: { orderIndex: i },
      });
    }
  }
}
