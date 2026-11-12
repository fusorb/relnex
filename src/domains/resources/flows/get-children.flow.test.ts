// getChildrenFlow visibility: a public caller must not see a resource's
// private/draft children; the owner sees everything.
import { describe, expect, it, vi } from "vitest";
import type { FlowContext } from "@/core/flows/flow-context";
import { getChildrenFlow } from "./get-children.flow";

const PARENT = {
  id: "res_parent",
  authorId: "usr_owner",
  tenantId: "relnex-default",
  status: "PUBLISHED",
  visibility: "PUBLIC",
};

function makeCtx(parent: unknown = PARENT) {
  const db = {
    resource: {
      findFirst: vi.fn(async (_arg: unknown) => parent),
      findMany: vi.fn(async (_arg: unknown) => [] as unknown[]),
      count: vi.fn(async (_arg: unknown) => 0),
    },
  };
  const ctx = {
    db,
    userId: null,
    identityId: null,
    tenantId: "relnex-default",
    requestId: "test",
  } as unknown as FlowContext;
  return { db, ctx };
}

type WhereArg = { where: Record<string, unknown> };

describe("getChildrenFlow visibility", () => {
  it("hides private/draft children from a non-owner (anonymous)", async () => {
    const { db, ctx } = makeCtx();
    await getChildrenFlow.execute(
      { resourceId: "res_parent", page: 1, limit: 20, viewerId: null },
      ctx,
    );
    const arg = db.resource.findMany.mock.calls[0][0] as unknown as WhereArg;
    expect(arg.where.visibility).toEqual({ in: ["PUBLIC", "UNLISTED"] });
    expect(arg.where.status).toBe("PUBLISHED");
  });

  it("shows all children to the owner", async () => {
    const { db, ctx } = makeCtx();
    await getChildrenFlow.execute(
      { resourceId: "res_parent", page: 1, limit: 20, viewerId: "usr_owner" },
      ctx,
    );
    const arg = db.resource.findMany.mock.calls[0][0] as unknown as WhereArg;
    expect(arg.where).not.toHaveProperty("visibility");
    expect(arg.where).not.toHaveProperty("status");
  });

  it("404s when the parent is not visible to the caller", async () => {
    const draftParent = { ...PARENT, status: "DRAFT", visibility: "PRIVATE" };
    const { ctx } = makeCtx(draftParent);
    await expect(
      getChildrenFlow.execute(
        { resourceId: "res_parent", page: 1, limit: 20, viewerId: "usr_other" },
        ctx,
      ),
    ).rejects.toThrow("Resource not found");
  });
});
