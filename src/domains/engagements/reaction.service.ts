import type { DbClient } from "@/core/flows/flow-context";
import { ReactionRepository } from "./reaction.repository";
import { ApiError } from "@/lib/errors";

export class ReactionService {
  private repo: ReactionRepository;
  constructor(private db: DbClient) {
    this.repo = new ReactionRepository(db);
  }

  async addReaction(userId: string, resourceId: string, type: string = "like", tenantId?: string | null) {
    const existing = await this.repo.findByUserAndResourceAndType(userId, resourceId, type);
    if (existing) return existing;

    return this.repo.create({ userId, resourceId, type, tenantId });
  }

  async removeReaction(userId: string, resourceId: string, type: string = "like") {
    const existing = await this.repo.findByUserAndResourceAndType(userId, resourceId, type);
    if (!existing) throw ApiError.notFound("Reaction not found");
    return this.repo.delete(existing.id);
  }

  async listByResource(resourceId: string, tenantId?: string | null) {
    return this.repo.findByResource(resourceId, tenantId);
  }
}