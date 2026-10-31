import { randomUUID } from "crypto";
import { prisma }     from "@/core/db/prisma";
import { ZodError }   from "zod";
import type { Flow }        from "./flow";
import type { DbClient, FlowContext } from "./flow-context";
import { FlowError }  from "./flow-error";
import { logger }     from "@/lib/useful/utils/logger";
import type { Prisma } from "@prisma-client";

type InboundCtx = Omit<FlowContext, "requestId" | "db">;

async function withTx<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn, { timeout: 10_000, maxWait: 5_000 });
}

export class FlowExecutor {
  async run<I, O>(
    flow:    Flow<I, O>,
    input:   unknown,
    ctx:     InboundCtx,
    opts?:   { transaction?: boolean }
  ): Promise<O> {
    const traceId       = randomUUID();
    const useTransaction = opts?.transaction ?? true;

    const exec = async (db: DbClient): Promise<O> => {
      const parsed = flow.inputSchema.parse(input);
      const enriched: FlowContext = { ...ctx, requestId: traceId, db };
      const result = await flow.execute(parsed, enriched);
      if (flow.outputSchema) flow.outputSchema.parse(result);
      return result;
    };

    try {
      logger.debug(`[FLOW] ${flow.name} start`, { traceId });
      const result = useTransaction
        ? await withTx((tx) => exec(tx))
        : await exec(prisma);
      logger.info(`[FLOW] ${flow.name} ok`, { traceId });
      return result;
    } catch (err: unknown) {
      const message = (err as Error)?.message ?? "Unexpected error";
      logger.error(`[FLOW] ${flow.name} fail`, { traceId, message });

      // Re-throw FlowError - carries its own statusCode, handled by handleError
      if (err instanceof FlowError) throw err;

      // Re-throw ZodError - handled by handleError (returns 422 with field errors)
      if (err instanceof ZodError) throw err;

      // Re-throw ApiError (statusCode) and SgError (status) via duck-typing
      // to avoid circular import: handle-error.ts → @/core/flows → flow-executor.ts
      if (err && typeof err === "object" && err !== null) {
        const e = err as { statusCode?: number; status?: number };
        if (typeof e.statusCode === "number" || typeof e.status === "number") throw err;
      }

      // Wrap truly unexpected errors as 500
      throw new FlowError("FLOW_ERROR", message, 500);
    }
  }
}

export const flowExecutor = new FlowExecutor();
