import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "@/core/flows/flow-context";
import type { FlowContext } from "@/core/flows/flow-context";
import { FollowService } from "./follow.service";
import { addReactionFlow } from "./flows/add-reaction.flow";

const metricsRow = {
  views: 0,
  opens: 0,
  downloads: 0,
  shares: 0,
  likes: 1,
  bookmarks: 0,
  comments: 0,
  engagementScore: 2,
};

describe("FollowService", () => {
  function makeFollowDb(existing: unknown = null) {
    return {
      follow: {
        findUnique: vi.fn(async (_a: unknown) => existing),
        findMany: vi.fn(async (_a: unknown) => []),
        count: vi.fn(async (_a: unknown) => 0),
        create: vi.fn(async (_a: unknown) => ({ id: "f1" })),
        delete: vi.fn(async (_a: unknown) => ({ id: "f1" })),
      },
    };
  }

  it("refuses to follow yourself", async () => {
    const svc = new FollowService(makeFollowDb() as unknown as DbClient);
    await expect(svc.follow("u1", "u1")).rejects.toThrow("Cannot follow yourself");
  });

  it("is idempotent - a repeat follow reuses the existing edge", async () => {
    const db = makeFollowDb({ id: "f1" });
    const svc = new FollowService(db as unknown as DbClient);
    await expect(svc.follow("u1", "u2")).resolves.toEqual({ id: "f1" });
    expect(db.follow.create).not.toHaveBeenCalled();
  });

  it("404s when unfollowing an edge that does not exist", async () => {
    const svc = new FollowService(makeFollowDb(null) as unknown as DbClient);
    await expect(svc.unfollow("u1", "u2")).rejects.toThrow("Follow not found");
  });
});

describe("addReactionFlow", () => {
  const publicResource = { id: "r1", authorId: "u1", status: "PUBLISHED", visibility: "PUBLIC" };
  const privateResource = { id: "r1", authorId: "u9", status: "DRAFT", visibility: "PRIVATE" };

  function makeCtx(opts: { resource: unknown; existingReaction?: unknown }) {
    const db = {
      resource: { findFirst: vi.fn(async (_a: unknown) => opts.resource) },
      reaction: {
        findUnique: vi.fn(async (_a: unknown) => opts.existingReaction ?? null),
        create: vi.fn(async (_a: unknown) => ({ id: "re1" })),
      },
      resourceMetrics: {
        upsert: vi.fn(async (_a: unknown) => ({ ...metricsRow, likes: 0, engagementScore: 0 })),
        update: vi.fn(async (_a: unknown) => metricsRow),
      },
    };
    const ctx = {
      db,
      userId: "u2",
      identityId: null,
      tenantId: "t1",
      requestId: "test",
    } as unknown as FlowContext;
    return { db, ctx };
  }

  it("404s when the caller cannot read the resource", async () => {
    const { ctx } = makeCtx({ resource: privateResource });
    await expect(addReactionFlow.execute({ resourceId: "r1" }, ctx)).rejects.toThrow(
      "Resource not found",
    );
  });

  it("adds a LIKE and moves the likes counter once", async () => {
    const { db, ctx } = makeCtx({ resource: publicResource });
    await expect(addReactionFlow.execute({ resourceId: "r1" }, ctx)).resolves.toEqual({
      added: true,
      reactionId: "re1",
    });
    expect(db.resourceMetrics.upsert).toHaveBeenCalled();
  });

  it("leaves the counter alone when the reaction already existed", async () => {
    const { db, ctx } = makeCtx({ resource: publicResource, existingReaction: { id: "re1" } });
    await expect(addReactionFlow.execute({ resourceId: "r1" }, ctx)).resolves.toEqual({
      added: false,
      reactionId: "re1",
    });
    expect(db.resourceMetrics.upsert).not.toHaveBeenCalled();
  });
});
