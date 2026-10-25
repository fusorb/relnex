import { NextRequest, NextResponse } from "next/server";
import { getSession, type AuthSession } from "./get-session";
import { prisma } from "@/core/db/prisma";

type AuthedHandler = (req: NextRequest, session: AuthSession) => Promise<NextResponse>;

/**
 * Requires a valid Sg JWT. Returns 401 if missing or invalid.
 */
export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }
    return handler(req, session);
  };
}

/**
 * Requires authentication AND a Relnex User record.
 * If the identity has no User yet (first login), provisions one automatically.
 */
export function withUser(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!session.user) {
      // Lazy-provision User on first login
      session.user = await prisma.user.create({
        data: {
          identityId: session.identityId,
          username:   `user_${session.identityId.slice(0, 8)}`,
          tenantId:   session.tenantId,
        },
      });
    }

    return handler(req, session);
  };
}

/**
 * Requires a specific OAuth scope in the token.
 */
export function withScope(requiredScope: string, handler: AuthedHandler) {
  return withAuth(async (req, session) => {
    if (!session.scope.includes(requiredScope)) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN", message: `Scope '${requiredScope}' required` },
        { status: 403 }
      );
    }
    return handler(req, session);
  });
}
