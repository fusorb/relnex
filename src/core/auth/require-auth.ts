import { NextRequest } from "next/server";
import { getSession, type AuthSession, type OnboardedSession } from "./get-session";
import { prisma } from "@/core/db/prisma";
import { ApiError } from "@/lib/errors";
import { resolveTenantId } from "@/core/tenancy";

/**
 * Inline guard - returns AuthSession or throws ApiError.unauthorized.
 * Used inside handleApiRoute wrappers.
 *
 * Usage: const session = await requireAuth(req);
 */
export async function requireAuth(req: NextRequest): Promise<AuthSession> {
  const session = await getSession(req);
  if (!session) throw ApiError.unauthorized("Authentication required");
  return session;
}

/**
 * Like requireAuth but also ensures the Relnex User record exists.
 * If the identity has no User yet (first login), provisions one automatically.
 * Used for routes that need a fully configured User profile.
 *
 * Usage: const session = await requireOnboarded(req);
 */
export async function requireOnboarded(req: NextRequest): Promise<OnboardedSession> {
  const session = await requireAuth(req);
  const user =
    session.user ??
    (await prisma.user.create({
      data: {
        identityId: session.identityId,
        username: `user_${session.identityId.slice(0, 8)}`,
        tenantId: resolveTenantId(session.tenantId),
      },
    }));
  session.userId = user.id;
  return { ...session, user, userId: user.id };
}
