import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import type { Prisma } from "@prisma-client";
import { UserRepository } from "./user.repository";
import { presentPublicUser } from "./users.presenter";
import { ApiError } from "@/lib/errors";

export class UserService {
  private db: DbClient;
  private repo: UserRepository;

  constructor(db: DbClient = prisma) {
    this.db = db;
    this.repo = new UserRepository(db);
  }

  async findOrThrow(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    return user;
  }

  async getUserDirectoryListing(tenantId?: string | null, page = 1, limit = 50) {
    const { items } = await this.repo.findMany({ tenantId, page, limit });
    return items.map(presentPublicUser);
  }

  async getPublicProfile(username: string) {
    const user = await this.repo.findByUsername(username);
    if (!user) throw ApiError.notFound("User not found");
    return presentPublicUser(user);
  }

  async getUserNestedCollections(username: string, viewerId?: string | null) {
    const user = await this.repo.findByUsername(username);
    if (!user) throw ApiError.notFound("User not found");
    const isOwner = viewerId != null && viewerId === user.id;
    const visible: Prisma.CollectionWhereInput = { visibility: { in: ["PUBLIC", "UNLISTED"] } };
    return this.db.collection.findMany({
      where: {
        authorId: user.id,
        deletedAt: null,
        // Owners see everything; everyone else only PUBLIC / UNLISTED.
        ...(isOwner ? {} : visible),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getUserKnowledgeGraph(username: string) {
    const user = await this.repo.findByUsername(username);
    if (!user) throw ApiError.notFound("User not found");
    const resources = await this.db.resource.findMany({
      where: { authorId: user.id, status: "PUBLISHED", deletedAt: null },
      select: { id: true, title: true },
    });
    const edges = await this.db.relation.findMany({
      where: { fromId: { in: resources.map(r => r.id) } },
      select: { fromId: true, toId: true, type: true },
    });
    const nodes = resources.map(r => ({ id: r.id, title: r.title }));
    return { nodes, edges };
  }

  async getUserNestedResources(username: string, viewerId?: string | null) {
    const user = await this.repo.findByUsername(username);
    if (!user) throw ApiError.notFound("User not found");
    const isOwner = viewerId != null && viewerId === user.id;
    const visible: Prisma.ResourceWhereInput = {
      visibility: { in: ["PUBLIC", "UNLISTED"] },
      status: "PUBLISHED",
    };
    return this.db.resource.findMany({
      where: {
        authorId: user.id,
        deletedAt: null,
        // Non-owners only see published PUBLIC / UNLISTED resources - never
        // private or draft ones.
        ...(isOwner ? {} : visible),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getUserNestedSaved(username: string, viewerId?: string | null) {
    const user = await this.repo.findByUsername(username);
    if (!user) throw ApiError.notFound("User not found");
    // Saved resources are private to their owner.
    if (viewerId !== user.id) throw ApiError.forbidden("Saved resources are private");
    return this.db.savedResource.findMany({
      where: { userId: user.id },
      include: { resource: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getUserAnalytics(username: string) {
    const user = await this.repo.findByUsername(username);
    if (!user) throw ApiError.notFound("User not found");
    const [resources, collections, saved, followers, following] = await Promise.all([
      this.db.resource.count({ where: { authorId: user.id, deletedAt: null } }),
      this.db.collection.count({ where: { authorId: user.id, deletedAt: null } }),
      this.db.savedResource.count({ where: { userId: user.id } }),
      this.db.follow.count({ where: { followingId: user.id } }),
      this.db.follow.count({ where: { followerId: user.id } }),
    ]);
    return { resources, collections, saved, followers, following };
  }
}
