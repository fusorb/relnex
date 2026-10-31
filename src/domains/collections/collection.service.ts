import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import { CollectionRepository } from "./collection.repository";
import type { CreateCollectionInput } from "./collection.dto";
import { ApiError } from "@/lib/errors";

export class CollectionService {
  private repo: CollectionRepository;
  constructor(private db: DbClient = prisma) { this.repo = new CollectionRepository(db); }

  async getUserCollections(userId: string, tenantId?: string | null) {
    return this.repo.findByAuthor(userId, tenantId);
  }

  async createCollection(userId: string, input: CreateCollectionInput, tenantId?: string | null) {
    const created = await this.repo.create({
      author: { connect: { id: userId } },
      slug: input.slug,
      title: input.title,
      description: input.description,
      visibility: input.visibility ?? "PUBLIC",
      metadata: input.metadata,
      parent: input.parentId ? { connect: { id: input.parentId } } : undefined,
      tenantId: tenantId ?? null,
    });

    const full = await this.repo.findById(created.id, tenantId);
    if (!full) throw ApiError.internal("Failed to load created collection");
    return full;
  }

  async getCollection(id: string, tenantId?: string | null) {
    const collection = await this.repo.findById(id, tenantId);
    if (!collection) throw ApiError.notFound("Collection not found");
    return collection;
  }

  async updateCollection(id: string, userId: string, input: Partial<CreateCollectionInput>, tenantId?: string | null) {
    await this.assertOwnership(id, userId, tenantId);
    return this.repo.update(id, {
      title: input.title,
      description: input.description,
      visibility: input.visibility,
      metadata: input.metadata,
    });
  }

  async deleteCollection(id: string, userId: string, tenantId?: string | null) {
    await this.assertOwnership(id, userId, tenantId);
    return this.repo.softDelete(id);
  }

  async addResource(collectionId: string, resourceId: string, userId: string, tenantId?: string | null) {
    await this.assertOwnership(collectionId, userId, tenantId);
    const maxIndex = await this.repo.getMaxOrderIndex(collectionId);
    return this.db.collectionResource.create({
      data: { collectionId, resourceId, orderIndex: maxIndex + 1, tenantId },
    });
  }

  async assertOwnership(collectionId: string, userId: string, tenantId?: string | null) {
    const c = await this.repo.findById(collectionId, tenantId);
    if (!c) throw ApiError.notFound("Collection not found");
    if (c.authorId !== userId) throw ApiError.forbidden("You do not own this collection");
    return c;
  }

  async removeResource(collectionId: string, userId: string, resourceId: string, tenantId?: string | null) {
    await this.assertOwnership(collectionId, userId, tenantId);
    await this.repo.removeResourceFromCollection(collectionId, resourceId);
  }

  async reorderCollectionItems(collectionId: string, userId: string, orderedItemIds: string[], tenantId?: string | null) {
    await this.assertOwnership(collectionId, userId, tenantId);
    await this.repo.reorderResources(collectionId, orderedItemIds);
  }
}
