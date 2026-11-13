import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import { FollowRepository } from "./follow.repository";
import { ApiError } from "@/lib/errors";

export class FollowService {
  private repo: FollowRepository;
  constructor(private db: DbClient = prisma) {
    this.repo = new FollowRepository(db);
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw ApiError.badRequest("Cannot follow yourself");

    const existing = await this.repo.findByPair(followerId, followingId);
    if (existing) return existing;

    return this.repo.create({ followerId, followingId });
  }

  async unfollow(followerId: string, followingId: string) {
    const existing = await this.repo.findByPair(followerId, followingId);
    if (!existing) throw ApiError.notFound("Follow not found");
    return this.repo.delete(existing.id);
  }

  async isFollowing(followerId: string, followingId: string) {
    const existing = await this.repo.findByPair(followerId, followingId);
    return !!existing;
  }

  async listFollowers(userId: string, page = 1, limit = 50) {
    const { items, total } = await this.repo.findFollowers(userId, page, limit);
    return { items, total, page, limit };
  }

  async listFollowing(userId: string, page = 1, limit = 50) {
    const { items, total } = await this.repo.findFollowing(userId, page, limit);
    return { items, total, page, limit };
  }
}
