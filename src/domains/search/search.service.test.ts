// The unified search response must carry the SAME pagination envelope in every
// section ({ items, total, page, limit }) - the old shape mixed a bare
// { items, total } with { items, pagination }.
import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "@/core/flows/flow-context";
import { SearchService } from "./search.service";

function makeDb() {
  return {
    resource: {
      findMany: vi.fn(async (_arg: unknown) => [{ id: "r1" }]),
      count: vi.fn(async (_arg: unknown) => 1),
    },
    user: {
      findMany: vi.fn(async (_arg: unknown) => [{ id: "u1" }]),
      count: vi.fn(async (_arg: unknown) => 3),
    },
    collection: {
      findMany: vi.fn(async (_arg: unknown) => []),
      count: vi.fn(async (_arg: unknown) => 0),
    },
  };
}

describe("SearchService.search envelopes", () => {
  it("wraps every section in { items, total, page, limit }", async () => {
    const service = new SearchService(makeDb() as unknown as DbClient);
    const result = await service.search({ q: "x", type: "all", page: 2, limit: 5, tenantId: "t1" });

    expect(result.resources).toEqual({ items: [{ id: "r1" }], total: 1, page: 2, limit: 5 });
    expect(result.users).toEqual({ items: [{ id: "u1" }], total: 3, page: 2, limit: 5 });
    expect(result.collections).toEqual({ items: [], total: 0, page: 2, limit: 5 });
    expect(result.query).toBe("x");
  });

  it("returns empty envelopes (not missing keys) for unrequested sections", async () => {
    const service = new SearchService(makeDb() as unknown as DbClient);
    const result = await service.search({ q: "x", type: "resources", page: 1, limit: 20 });

    expect(result.resources.total).toBe(1);
    expect(result.users).toEqual({ items: [], total: 0, page: 1, limit: 20 });
    expect(result.collections).toEqual({ items: [], total: 0, page: 1, limit: 20 });
  });
});
