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

  /**
   * The PUBLIC profile graph (`GET /api/users/[username]/graph`, unauthenticated).
   * Only PUBLIC resources may appear here - without the visibility filter a user's
   * private-but-published resources leaked into an anonymous endpoint.
   */
  async getUserKnowledgeGraph(username: string) {
    const user = await this.repo.findByUsername(username);
    if (!user) throw ApiError.notFound("User not found");
    const own = await this.db.resource.findMany({
      where: {
        authorId: user.id,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        deletedAt: null,
      },
      select: { id: true, title: true, type: true },
    });
    return this.assembleGraph(own, user.tenantId, true);
  }

  /** The signed-in user's knowledge graph, scoped to the verified tenant. */
  async getKnowledgeGraph(userId: string, tenantId?: string | null) {
    const own = await this.db.resource.findMany({
      where: {
        authorId: userId,
        status: "PUBLISHED",
        deletedAt: null,
        ...(tenantId ? { tenantId } : {}),
      },
      select: { id: true, title: true, type: true },
    });
    return this.assembleGraph(own, tenantId);
  }

  /**
   * Builds a renderable graph from a node set. Edges never dangle: a relation is
   * only returned when both ends resolve to a visible node, and visible external
   * targets (other authors' published resources) are pulled in as extra nodes.
   *
   * `publicOnly` narrows every visibility check to PUBLIC - required for the
   * anonymous profile graph, which must never surface UNLISTED or PRIVATE rows.
   */
  private async assembleGraph(
    own: { id: string; title: string | null; type: string }[],
    tenantId?: string | null,
    publicOnly = false,
  ) {
    if (own.length === 0) return { nodes: [], edges: [] };

    const tenantFilter = tenantId ? { tenantId } : {};
    const visibleVisibility: Prisma.ResourceWhereInput["visibility"] = publicOnly
      ? "PUBLIC"
      : { in: ["PUBLIC", "UNLISTED"] };
    const ownIds = own.map((r) => r.id);
    const relations = await this.db.relation.findMany({
      where: { fromId: { in: ownIds }, ...tenantFilter },
      select: { fromId: true, toId: true, type: true },
    });

    const ownIdSet = new Set(ownIds);
    const targetIds = [...new Set(relations.map((r) => r.toId))].filter((id) => !ownIdSet.has(id));
    const external = targetIds.length
      ? await this.db.resource.findMany({
          where: {
            id: { in: targetIds },
            status: "PUBLISHED",
            visibility: visibleVisibility,
            deletedAt: null,
            ...tenantFilter,
          },
          select: { id: true, title: true, type: true },
        })
      : [];

    const visibleIds = new Set([...ownIds, ...external.map((r) => r.id)]);
    return {
      nodes: [...own, ...external].map((r) => ({ id: r.id, title: r.title, type: r.type })),
      edges: relations.filter((r) => visibleIds.has(r.toId)),
    };
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
