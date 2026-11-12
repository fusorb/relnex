// assertVisible is the gate every resource read surface goes through. A "no"
// must be a 404, never a 403, so private resources cannot be probed by id.
import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "@/core/flows/flow-context";
import { ResourceService } from "./resource.service";

const PRIVATE_DRAFT = {
  id: "r1",
  authorId: "u1",
  status: "DRAFT",
  visibility: "PRIVATE",
  tenantId: "t1",
};

function makeService(resource: unknown) {
  const db = { resource: { findFirst: vi.fn(async (_arg: unknown) => resource) } };
  return new ResourceService(db as unknown as DbClient);
}

describe("ResourceService.assertVisible", () => {
  it("returns the resource to its author", async () => {
    const service = makeService(PRIVATE_DRAFT);
    await expect(service.assertVisible("r1", "u1", "t1")).resolves.toMatchObject({ id: "r1" });
  });

  it("404s for a non-author when the resource is a private draft", async () => {
    const service = makeService(PRIVATE_DRAFT);
    await expect(service.assertVisible("r1", "u2", "t1")).rejects.toThrow("Resource not found");
  });

  it("404s when the resource does not exist", async () => {
    const service = makeService(null);
    await expect(service.assertVisible("missing", "u1", "t1")).rejects.toThrow("Resource not found");
  });
});

describe("ResourceService.attachTags", () => {
  it("refuses to mutate tags on someone else's resource", async () => {
    const service = makeService(PRIVATE_DRAFT);
    await expect(service.attachTags("r1", "u2", "t1", ["tag_1"])).rejects.toThrow(
      "You do not own this resource",
    );
  });
});
