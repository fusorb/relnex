import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import { ResourceRepository } from "./resource.repository";
import type { ListResourcesInput } from "./resource.dto";
import { canViewResource } from "./resource.visibility";
import { ApiError } from "@/lib/errors";

export class ResourceService {
  private repo: ResourceRepository;
  constructor(private db: DbClient = prisma) {
    this.repo = new ResourceRepository(db);
  }

  /**
   * Lists only what the viewer may see: their own resources in any state, plus
   * everyone's published non-private ones (see resource.visibility).
   */
  async listResources(
    tenantId: string | null,
    filters: ListResourcesInput,
    viewerId?: string | null,
  ) {
    return this.repo.findMany({
      ...filters,
      tenantId: tenantId ?? undefined,
      viewerId,
    });
  }

  async assertOwnership(resourceId: string, userId: string, tenantId?: string | null) {
    const resource = await this.repo.findById(resourceId, tenantId);
    if (!resource)            throw ApiError.notFound("Resource not found");
    if (resource.authorId !== userId) throw ApiError.forbidden("You do not own this resource");
    return resource;
  }

  async assertExists(resourceId: string, tenantId?: string | null) {
    const resource = await this.repo.findById(resourceId, tenantId);
    if (!resource) throw ApiError.notFound("Resource not found");
    return resource;
  }

  /**
   * Returns a resource only if the viewer may read it; otherwise 404s. A "no" is
   * deliberately 404 rather than 403 so private resources cannot be discovered
   * by probing ids (see resource.visibility).
   */
  async assertVisible(
    resourceId: string,
    viewerId: string | null | undefined,
    tenantId?: string | null,
  ) {
    const resource = await this.repo.findById(resourceId, tenantId);
    if (!resource || !canViewResource(resource, viewerId)) {
      throw ApiError.notFound("Resource not found");
    }
    return resource;
  }

  async getResourceTags(
    resourceId: string,
    viewerId: string | null | undefined,
    tenantId?: string | null,
  ) {
    const resource = await this.assertVisible(resourceId, viewerId, tenantId);
    return resource.resourceTags.map((rt) => rt.tag);
  }

  // Tags are part of the resource, so mutating them requires ownership.
  async attachTags(
    resourceId: string,
    userId: string,
    tenantId: string | null | undefined,
    tagIds?: string[],
  ) {
    await this.assertOwnership(resourceId, userId, tenantId);
    if (!tagIds || tagIds.length === 0) return;
    await this.repo.attachTags(resourceId, tagIds);
  }

  async detachTags(
    resourceId: string,
    userId: string,
    tenantId: string | null | undefined,
    tagIds?: string[],
  ) {
    await this.assertOwnership(resourceId, userId, tenantId);
    if (!tagIds || tagIds.length === 0) return;
    await this.repo.detachTags(resourceId, tagIds);
  }

  async listVersions(
    resourceId: string,
    viewerId: string | null | undefined,
    tenantId?: string | null,
  ) {
    await this.assertVisible(resourceId, viewerId, tenantId);
    return this.repo.listVersions(resourceId, tenantId);
  }

  async listSavedResources(userId: string, tenantId?: string | null) {
    return this.repo.listSavedResources(userId, tenantId);
  }

  async archiveResource(resourceId: string, userId: string, tenantId?: string | null) {
    const resource = await this.assertOwnership(resourceId, userId, tenantId);
    await this.repo.update(resourceId, { status: "ARCHIVED" });
    return { ...resource, status: "ARCHIVED" as const };
  }

  async deleteResource(resourceId: string, userId: string, tenantId?: string | null) {
    await this.assertOwnership(resourceId, userId, tenantId);
    return this.repo.softDelete(resourceId);
  }
}
