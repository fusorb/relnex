import { NextRequest, NextResponse } from "next/server";
import { handleError } from "./handle-error";

type RouteHandler<T = unknown> = (
  req: NextRequest,
  context: { params: T }
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with error handling.
 * Catches ApiError, ZodError, SgError, and generic errors
 * and returns properly formatted JSON error responses.
 *
 * Next.js 15+ passes `params` as a Promise; this wrapper awaits it and hands
 * the resolved value to the handler so handlers can keep using sync params.
 *
 * Usage:
 *   export const GET = handleApiRoute(async (req, { params }) => {
 *     const session = await requireAuth(req);
 *     return NextResponse.json({ success: true, data: result });
 *   });
 */
export function handleApiRoute<T = unknown>(handler: RouteHandler<T>) {
  return async (
    req: NextRequest,
    context: { params: T | Promise<T> }
  ): Promise<NextResponse> => {
    const params = await context.params;
    try {
      return await handler(req, { params });
    } catch (err) {
      return handleError(err);
    }
  };
}
