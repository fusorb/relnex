import { describe, expect, it } from "vitest";
import { canViewResource, visibleResourceWhere } from "./resource.visibility";

describe("canViewResource", () => {
  it("lets the author read their own resource in any state", () => {
    expect(canViewResource({ authorId: "u1", status: "DRAFT", visibility: "PRIVATE" }, "u1")).toBe(true);
    expect(canViewResource({ authorId: "u1", status: "ARCHIVED", visibility: "PRIVATE" }, "u1")).toBe(true);
  });

  it("lets others read published, non-private resources", () => {
    expect(canViewResource({ authorId: "u1", status: "PUBLISHED", visibility: "PUBLIC" }, "u2")).toBe(true);
    expect(canViewResource({ authorId: "u1", status: "PUBLISHED", visibility: "UNLISTED" }, "u2")).toBe(true);
  });

  it("hides drafts and private resources from non-authors", () => {
    expect(canViewResource({ authorId: "u1", status: "PUBLISHED", visibility: "PRIVATE" }, "u2")).toBe(false);
    expect(canViewResource({ authorId: "u1", status: "DRAFT", visibility: "PUBLIC" }, "u2")).toBe(false);
    expect(canViewResource({ authorId: "u1", status: "ARCHIVED", visibility: "PUBLIC" }, "u2")).toBe(false);
  });

  it("treats anonymous viewers like any non-author", () => {
    expect(canViewResource({ authorId: "u1", status: "DRAFT", visibility: "PUBLIC" }, null)).toBe(false);
    expect(canViewResource({ authorId: "u1", status: "PUBLISHED", visibility: "PUBLIC" }, null)).toBe(true);
    expect(canViewResource({ authorId: "u1", status: "PUBLISHED", visibility: "UNLISTED" }, undefined)).toBe(true);
  });
});

describe("visibleResourceWhere", () => {
  it("mixes the caller's own resources with the published non-private set", () => {
    expect(visibleResourceWhere("u1")).toEqual({
      OR: [
        { authorId: "u1" },
        { status: "PUBLISHED", visibility: { in: ["PUBLIC", "UNLISTED"] } },
      ],
    });
  });

  it("falls back to published non-private only for anonymous callers", () => {
    expect(visibleResourceWhere(null)).toEqual({
      status: "PUBLISHED",
      visibility: { in: ["PUBLIC", "UNLISTED"] },
    });
  });
});
