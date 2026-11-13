import type { DbClient } from "@/core/flows/flow-context";

// Only what presentPublicUser needs, so followers/following render as the same
// user shape the rest of the API returns.
const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  archetype: true,
  createdAt: true,
} as const;

export class FollowRepository {
  constructor(private db: DbClient) {}

  async findByPair(followerId: string, followingId: string) {
    return this.db.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
  }

  async findFollowers(userId: string, page = 1, limit = 50) {
    const where = { followingId: userId };
    const [items, total] = await Promise.all([
      this.db.follow.findMany({
        where,
        include: { follower: { select: userSelect } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.follow.count({ where }),
    ]);
    return { items, total };
  }

  async findFollowing(userId: string, page = 1, limit = 50) {
    const where = { followerId: userId };
    const [items, total] = await Promise.all([
      this.db.follow.findMany({
        where,
        include: { following: { select: userSelect } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.follow.count({ where }),
    ]);
    return { items, total };
  }

  async create(data: { followerId: string; followingId: string }) {
    return this.db.follow.create({ data });
  }

  async delete(id: string) {
    return this.db.follow.delete({ where: { id } });
  }
}
