import { describe, expect, it, vi } from "vitest";
import type { FlowContext } from "@/core/flows/flow-context";
import { updateCommentStatusFlow } from "./update-comment-status.flow";

function makeCtx(comment: unknown, userId: string) {
  const db = {
    comment: {
      findUnique: vi.fn(async (_arg: unknown) => comment),
      update: vi.fn(async (_arg: unknown) => ({ ...(comment as object), status: "HIDDEN" })),
    },
  };
  const ctx = {
    db,
    userId,
    identityId: null,
    tenantId: "t1",
    requestId: "test",
  } as unknown as FlowContext;
  return { db, ctx };
}

describe("updateCommentStatusFlow", () => {
  const comment = { id: "c1", authorId: "u1", status: "ACTIVE" };

  it("lets the author moderate their own comment", async () => {
    const { ctx } = makeCtx(comment, "u1");
    await expect(
      updateCommentStatusFlow.execute({ commentId: "c1", status: "HIDDEN" }, ctx),
    ).resolves.toBeTruthy();
  });

  it("refuses a non-author", async () => {
    const { ctx } = makeCtx(comment, "u2");
    await expect(
      updateCommentStatusFlow.execute({ commentId: "c1", status: "HIDDEN" }, ctx),
    ).rejects.toThrow("Cannot modify this comment");
  });

  it("404s when the comment does not exist", async () => {
    const { ctx } = makeCtx(null, "u1");
    await expect(
      updateCommentStatusFlow.execute({ commentId: "nope", status: "HIDDEN" }, ctx),
    ).rejects.toThrow("Comment not found");
  });
});
