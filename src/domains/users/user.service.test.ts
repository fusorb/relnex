// Regression guard for the profile nested-visibility rules. These endpoints are
// optionally-authenticated and MUST NOT leak private data: non-owners get only
// PUBLISHED PUBLIC/UNLISTED resources + PUBLIC/UNLISTED collections, and saved
// resources are owner-only.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DbClient } from "@/core/flows/flow-context";
import { UserService } from "./user.service";

const OWNER = { id: "usr_owner", username: "ada" };

function makeDb() {
  return {
    user: { findFirst: vi.fn(async (_arg: unknown) => OWNER) },
    collection: { findMany: vi.fn(async (_arg: unknown) => [] as unknown[]) },
    resource: { findMany: vi.fn(async (_arg: unknown) => [] as unknown[]) },
    savedResource: { findMany: vi.fn(async (_arg: unknown) => [{ id: "sav_1" }]) },
  };
}

type WhereArg = { where: Record<string, unknown> };

describe("UserService nested visibility", () => {
  let db: ReturnType<typeof makeDb>;
  let service: UserService;

  beforeEach(() => {
    db = makeDb();
    service = new UserService(db as unknown as DbClient);
  });

  it("limits collections to PUBLIC/UNLISTED for non-owners", async () => {
    await service.getUserNestedCollections("ada", "usr_other");
    const arg = db.collection.findMany.mock.calls[0][0] as unknown as WhereArg;
    expect(arg.where.visibility).toEqual({ in: ["PUBLIC", "UNLISTED"] });
  });

  it("returns all collections to the owner", async () => {
    await service.getUserNestedCollections("ada", OWNER.id);
    const arg = db.collection.findMany.mock.calls[0][0] as unknown as WhereArg;
    expect(arg.where).not.toHaveProperty("visibility");
  });

  it("limits resources to published PUBLIC/UNLISTED for non-owners (incl. anonymous)", async () => {
    await service.getUserNestedResources("ada", null);
    const arg = db.resource.findMany.mock.calls[0][0] as unknown as WhereArg;
    expect(arg.where.visibility).toEqual({ in: ["PUBLIC", "UNLISTED"] });
    expect(arg.where.status).toBe("PUBLISHED");
  });

  it("returns all resources to the owner", async () => {
    await service.getUserNestedResources("ada", OWNER.id);
    const arg = db.resource.findMany.mock.calls[0][0] as unknown as WhereArg;
    expect(arg.where).not.toHaveProperty("visibility");
    expect(arg.where).not.toHaveProperty("status");
  });

  it("forbids reading another user's saved resources", async () => {
    await expect(service.getUserNestedSaved("ada", "usr_other")).rejects.toThrow();
    expect(db.savedResource.findMany).not.toHaveBeenCalled();
  });

  it("forbids anonymous reads of saved resources", async () => {
    await expect(service.getUserNestedSaved("ada", undefined)).rejects.toThrow();
    expect(db.savedResource.findMany).not.toHaveBeenCalled();
  });

  it("allows the owner to read their saved resources", async () => {
    const saved = await service.getUserNestedSaved("ada", OWNER.id);
    expect(saved).toEqual([{ id: "sav_1" }]);
  });
});
