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
 * Usage:
 *   export const GET = handleApiRoute(async (req, { params }) => {
 *     const session = await requireAuth(req);
 *     return NextResponse.json({ success: true, data: result });
 *   });
 */
export function handleApiRoute<T = unknown>(handler: RouteHandler<T>) {
  return async (
    req: NextRequest,
    context: { params: T }
  ): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (err) {
      return handleError(err);
    }
  };
}
