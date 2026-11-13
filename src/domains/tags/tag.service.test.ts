import { describe, expect, it, vi } from "vitest";
import type { DbClient } from "@/core/flows/flow-context";
import { TagService } from "./index";

const tag = { id: "t1", name: "Old", slug: "old" };

function makeDb(opts: { tag?: unknown; clash?: unknown } = {}) {
  return {
    tag: {
      // First call = findById; second = the rename collision lookup.
      findFirst: vi
        .fn()
        .mockResolvedValueOnce(opts.tag === undefined ? tag : opts.tag)
        .mockResolvedValueOnce(opts.clash ?? null),
      update: vi.fn(async (_a: unknown) => ({ ...tag, name: "New", slug: "new" })),
      delete: vi.fn(async (_a: unknown) => tag),
    },
    resourceTag: {
      findMany: vi.fn(async (_a: unknown) => []),
      createMany: vi.fn(async (_a: unknown) => ({ count: 0 })),
      deleteMany: vi.fn(async (_a: unknown) => ({ count: 0 })),
    },
  };
}

describe("TagService", () => {
  it("renames a tag and re-derives the slug", async () => {
    const db = makeDb();
    const svc = new TagService(db as unknown as DbClient);
    await expect(svc.renameTag("t1", { name: "New" }, "t1")).resolves.toBeTruthy();
    expect(db.tag.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "t1" }, data: { name: "New", slug: "new" } }),
    );
  });

  it("409s when another tag already uses the name", async () => {
    const db = makeDb({ clash: { id: "t2", name: "New", slug: "new" } });
    const svc = new TagService(db as unknown as DbClient);
    await expect(svc.renameTag("t1", { name: "New" }, "t1")).rejects.toThrow(
      "A tag with that name already exists",
    );
  });

  it("allows a rename that only matches the tag itself", async () => {
    const db = makeDb({ tag: { id: "t1", name: "New", slug: "new" }, clash: { id: "t1" } });
    const svc = new TagService(db as unknown as DbClient);
    await expect(svc.renameTag("t1", { name: "New" }, "t1")).resolves.toBeTruthy();
  });

  it("404s when deleting an unknown tag", async () => {
    const db = makeDb({ tag: null });
    const svc = new TagService(db as unknown as DbClient);
    await expect(svc.deleteTag("nope", "t1")).rejects.toThrow("Tag not found");
  });

  it("deletes a tag", async () => {
    const db = makeDb();
    const svc = new TagService(db as unknown as DbClient);
    await svc.deleteTag("t1", "t1");
    expect(db.tag.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
  });

  it("refuses to merge a tag into itself", async () => {
    const svc = new TagService(makeDb() as unknown as DbClient);
    await expect(svc.mergeTags("t1", "t1", "t1")).rejects.toThrow(
      "Cannot merge a tag into itself",
    );
  });

  it("merges: moves only the new links, then deletes the source", async () => {
    const db = makeDb();
    db.tag.findFirst = vi
      .fn()
      .mockResolvedValueOnce(tag)
      .mockResolvedValueOnce({ id: "t2", name: "New", slug: "new" });
    db.resourceTag.findMany = vi
      .fn()
      .mockResolvedValueOnce([{ resourceId: "r2" }]) // target already links r2
      .mockResolvedValueOnce([{ resourceId: "r1" }, { resourceId: "r2" }]); // source links

    const svc = new TagService(db as unknown as DbClient);
    await expect(svc.mergeTags("t1", "t2", "t1")).resolves.toEqual({
      id: "t2",
      name: "New",
      slug: "new",
    });
    expect(db.resourceTag.createMany).toHaveBeenCalledWith({
      data: [{ resourceId: "r1", tagId: "t2" }],
      skipDuplicates: true,
    });
    expect(db.tag.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
  });
});
