import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "@/core/flows/flow-context";
import { CollectionService } from "./collection.service";
import { canViewCollection, visibleCollectionWhere } from "./collection.visibility";

describe("canViewCollection", () => {
  it("lets the author read their own private collection", () => {
    expect(canViewCollection({ authorId: "u1", visibility: "PRIVATE" }, "u1")).toBe(true);
  });

  it("lets others read public and unlisted collections", () => {
    expect(canViewCollection({ authorId: "u1", visibility: "PUBLIC" }, "u2")).toBe(true);
    expect(canViewCollection({ authorId: "u1", visibility: "UNLISTED" }, "u2")).toBe(true);
  });

  it("hides private collections from non-authors and anonymous viewers", () => {
    expect(canViewCollection({ authorId: "u1", visibility: "PRIVATE" }, "u2")).toBe(false);
    expect(canViewCollection({ authorId: "u1", visibility: "PRIVATE" }, null)).toBe(false);
    expect(canViewCollection({ authorId: "u1", visibility: "PRIVATE" }, undefined)).toBe(false);
  });
});

describe("visibleCollectionWhere", () => {
  it("mixes the caller's own collections with the non-private set", () => {
    expect(visibleCollectionWhere("u1")).toEqual({
      OR: [{ authorId: "u1" }, { visibility: { in: ["PUBLIC", "UNLISTED"] } }],
    });
  });

  it("falls back to non-private only for anonymous callers", () => {
    expect(visibleCollectionWhere(null)).toEqual({
      visibility: { in: ["PUBLIC", "UNLISTED"] },
    });
  });
});

function makeService(collection: unknown) {
  const db = { collection: { findFirst: vi.fn(async (_arg: unknown) => collection) } };
  return new CollectionService(db as unknown as DbClient);
}

describe("CollectionService.assertVisible", () => {
  const PRIVATE = { id: "c1", authorId: "u1", visibility: "PRIVATE" };

  it("404s for a non-author on a private collection", async () => {
    const service = makeService(PRIVATE);
    await expect(service.assertVisible("c1", "u2", "t1")).rejects.toThrow("Collection not found");
  });

  it("returns the collection to its author", async () => {
    const service = makeService(PRIVATE);
    await expect(service.assertVisible("c1", "u1", "t1")).resolves.toMatchObject({ id: "c1" });
  });

  it("404s when the collection does not exist", async () => {
    const service = makeService(null);
    await expect(service.assertVisible("missing", "u1", "t1")).rejects.toThrow("Collection not found");
  });
});
