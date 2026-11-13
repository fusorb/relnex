import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import type { ReactionType } from "@prisma-client";
import { ReactionRepository } from "./reaction.repository";
import { ApiError } from "@/lib/errors";

export class ReactionService {
  private repo: ReactionRepository;
  constructor(private db: DbClient = prisma) {
    this.repo = new ReactionRepository(db);
  }

  /**
   * Idempotent: reacting twice leaves one reaction. `created` reports whether this
   * call actually inserted, so callers can keep the likes metric honest.
   */
  async addReaction(userId: string, resourceId: string, type: ReactionType = "LIKE", tenantId?: string | null) {
    const existing = await this.repo.findByUserAndResourceAndType(userId, resourceId, type);
    if (existing) return { reaction: existing, created: false };

    const reaction = await this.repo.create({ userId, resourceId, type, tenantId });
    return { reaction, created: true };
  }

  async removeReaction(userId: string, resourceId: string, type: ReactionType = "LIKE") {
    const existing = await this.repo.findByUserAndResourceAndType(userId, resourceId, type);
    if (!existing) throw ApiError.notFound("Reaction not found");
    await this.repo.delete(existing.id);
    return existing;
  }

  async listByResource(resourceId: string, tenantId?: string | null, page = 1, limit = 50) {
    const { items, total } = await this.repo.findByResource(resourceId, tenantId, page, limit);
    return { items, total, page, limit };
  }
}
