import type { DbClient } from "@/core/flows/flow-context";
import { SavedResourceRepository } from "./saved-resource.repository";
import { ApiError } from "@/lib/errors";

export class SavedResourceService {
  private repo: SavedResourceRepository;
  constructor(private db: DbClient) {
    this.repo = new SavedResourceRepository(db);
  }

  async save(userId: string, resourceId: string, tenantId?: string | null) {
    const existing = await this.repo.findByUserAndResource(userId, resourceId);
    if (existing) return existing;

    return this.repo.create({ userId, resourceId, tenantId });
  }

  async unsave(userId: string, resourceId: string) {
    const existing = await this.repo.findByUserAndResource(userId, resourceId);
    if (!existing) throw ApiError.notFound("Saved resource not found");
    return this.repo.delete(existing.id);
  }

  async listByUser(userId: string, tenantId?: string | null) {
    return this.repo.findByUser(userId, tenantId);
  }
}