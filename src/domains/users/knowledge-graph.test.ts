// assembleGraph (via getKnowledgeGraph) must never emit a dangling edge, and
// must pull in visible external targets as nodes.
import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "@/core/flows/flow-context";
import { UserService } from "./user.service";

function makeDb(own: unknown[], external: unknown[], relations: unknown[]) {
  const findMany = vi
    .fn(async (_arg: unknown) => own)
    .mockResolvedValueOnce(own)
    .mockResolvedValueOnce(external);
  return {
    resource: { findMany },
    relation: { findMany: vi.fn(async (_arg: unknown) => relations) },
  };
}

const OWN = [{ id: "r1", title: "One", type: "NOTE" }];

describe("UserService.getKnowledgeGraph", () => {
  it("returns empty graph without querying relations when the user has no resources", async () => {
    const db = makeDb([], [], []);
    const service = new UserService(db as unknown as DbClient);
    const graph = await service.getKnowledgeGraph("usr_1", "t1");
    expect(graph).toEqual({ nodes: [], edges: [] });
    expect(db.relation.findMany).not.toHaveBeenCalled();
  });

  it("keeps edges whose target is visible and adds the external node", async () => {
    const db = makeDb(
      OWN,
      [{ id: "r2", title: "Two", type: "ARTICLE" }],
      [
        { fromId: "r1", toId: "r2", type: "RELATED" },
        { fromId: "r1", toId: "gone", type: "REFERENCES" },
      ],
    );
    const service = new UserService(db as unknown as DbClient);
    const graph = await service.getKnowledgeGraph("usr_1", "t1");

    expect(graph.nodes.map((n) => n.id).sort()).toEqual(["r1", "r2"]);
    // The relation to the unresolved "gone" target is dropped, not dangling.
    expect(graph.edges).toEqual([{ fromId: "r1", toId: "r2", type: "RELATED" }]);
  });

  it("drops edges to invisible or deleted targets entirely", async () => {
    const db = makeDb(OWN, [], [{ fromId: "r1", toId: "gone", type: "REFERENCES" }]);
    const service = new UserService(db as unknown as DbClient);
    const graph = await service.getKnowledgeGraph("usr_1", "t1");

    expect(graph.nodes.map((n) => n.id)).toEqual(["r1"]);
    expect(graph.edges).toEqual([]);
  });

  it("scopes both queries to the tenant when one is supplied", async () => {
    const db = makeDb(OWN, [], []);
    const service = new UserService(db as unknown as DbClient);
    await service.getKnowledgeGraph("usr_1", "t1");

    const ownWhere = (db.resource.findMany.mock.calls[0][0] as { where: Record<string, unknown> }).where;
    const relWhere = (db.relation.findMany.mock.calls[0][0] as { where: Record<string, unknown> }).where;
    expect(ownWhere.tenantId).toBe("t1");
    expect(relWhere.tenantId).toBe("t1");
  });
});
