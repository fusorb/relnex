// Core: FlowExecutor validation, transactions, and error normalization.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { transaction, client } = vi.hoisted(() => {
  const client = { __client: true };
  return { transaction: vi.fn(), client };
});

vi.mock("@/core/db/prisma", () => ({ prisma: { $transaction: transaction, ...client } }));
vi.mock("@/lib/useful/utils/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { flowExecutor } from "./flow-executor";
import { FlowError } from "./flow-error";
import type { Flow } from "./flow";
import type { FlowContext } from "./flow-context";

const ctx = () => ({
  userId: null,
  identityId: null,
  tenantId: null,
});

function makeFlow<I, O>(over: Partial<Flow<I, O>> = {}): Flow<I, O> {
  return {
    name: "test:flow",
    inputSchema: z.unknown() as unknown as z.ZodType<I>,
    async execute() {
      return undefined as O;
    },
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  transaction.mockImplementation(async (fn: (c: unknown) => unknown) => fn(client));
});

describe("flowExecutor.run", () => {
  it("parses input and passes a FlowContext enriched with requestId + db", async () => {
    const execute = vi.fn(async () => "ok");
    const flow = makeFlow<{ n: number }, string>({
      inputSchema: z.object({ n: z.number() }),
      execute,
    });

    const result = await flowExecutor.run(flow, { n: 7 }, ctx());

    expect(result).toBe("ok");
    const [input, enriched] = execute.mock.calls[0] as [unknown, FlowContext];
    expect(input).toEqual({ n: 7 });
    expect(enriched.requestId).toEqual(expect.any(String));
    expect(enriched.db).toBe(client);
  });

  it("throws ZodError on invalid input and never executes the flow", async () => {
    const execute = vi.fn();
    const flow = makeFlow({
      name: "test:invalid",
      inputSchema: z.object({ n: z.number() }),
      execute,
    });

    await expect(flowExecutor.run(flow, { n: "no" }, ctx())).rejects.toBeInstanceOf(
      z.ZodError
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it("runs inside a transaction by default", async () => {
    const flow = makeFlow({ execute: async () => "ok" });
    await flowExecutor.run(flow, {}, ctx());
    expect(transaction).toHaveBeenCalledOnce();
  });

  it("skips the transaction when { transaction: false }", async () => {
    const flow = makeFlow({ execute: async () => "ok" });
    await flowExecutor.run(flow, {}, ctx(), { transaction: false });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("re-throws FlowError unchanged", async () => {
    const err = new FlowError("NOPE", "boom", 409);
    const flow = makeFlow({ execute: async () => { throw err; } });
    await expect(flowExecutor.run(flow, {}, ctx())).rejects.toBe(err);
  });

  it("wraps an unexpected error as a 500 FlowError", async () => {
    const flow = makeFlow({ execute: async () => { throw new Error("kaboom"); } });
    await expect(flowExecutor.run(flow, {}, ctx())).rejects.toMatchObject({
      name: "FlowError",
      statusCode: 500,
      message: "kaboom",
    });
  });

  it("re-throws errors that already carry a statusCode (duck-typed ApiError)", async () => {
    const apiLike = Object.assign(new Error("nope"), { statusCode: 403 });
    const flow = makeFlow({ execute: async () => { throw apiLike; } });
    await expect(flowExecutor.run(flow, {}, ctx())).rejects.toBe(apiLike);
  });
});
