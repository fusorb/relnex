// src/proxy.ts
// Next 16 "proxy" file convention (renamed from `middleware`): tenant header
// forwarding + protected-route gating.
//
// Tenant forwarding: extract `tid` (and `sub`) from the verified SovGrant JWT
// and inject them as `x-tenant-id` / `x-identity-id` request headers so route
// handlers read a single, consistent source. Verification currently uses the
// shared secret via verifySgToken; the user is migrating this to JWKS
// (createRemoteJWKSet against SovGrant's well-known endpoint) - keep the
// verification call behind verifySgToken so the swap is one-line.
//
// Import verifySgToken from the leaf module, never the `@/core/auth` barrel,
// so proxy stays off the Prisma import graph (get-session pulls prisma).

import { NextRequest, NextResponse } from "next/server";
import { verifySgToken } from "@/core/auth/jwt";
import { resolveTenantId } from "@/core/tenancy";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/resources",
  "/collections",
  "/graph",
  "/tags",
  "/settings",
  "/profile",
];

function isProtectedPage(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

async function extractToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return req.cookies.get("sg_at")?.value ?? null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through public API routes (no blocking), but still forward tenant
  // if a token happens to be present.
  const token = await extractToken(req);

  let tenantId: string | null = null;
  let identityId: string | null = null;
  let authenticated = false;

  if (token) {
    try {
      const payload = await verifySgToken(token);
      authenticated = true;
      identityId = payload.sub ?? null;
      tenantId = payload.tid ?? null;
    } catch {
      // Invalid/expired token - treat as unauthenticated. Fall through.
      authenticated = false;
    }
  }

  // Protected pages - redirect to login if unauthenticated.
  if (isProtectedPage(pathname) && !authenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Forward tenant/identity from the *verified* token only. Drop any
  // client-supplied values first (anti-spoof), and always emit a concrete
  // tenant (the reserved default scope) so downstream queries are never
  // left unscoped when the token carries no `tid`.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete("x-tenant-id");
  requestHeaders.delete("x-identity-id");
  requestHeaders.set("x-tenant-id", resolveTenantId(tenantId));
  if (identityId) requestHeaders.set("x-identity-id", identityId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};