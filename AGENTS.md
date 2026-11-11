# Relnex - Agent Instructions

> Loaded automatically every session. For the full handbook - architecture,
> patterns, and rules - see `CLAUDE.md` and `docs/architecture.md` in this root.

---

## What Relnex Is

Next.js 16 knowledge-graph app. Auth delegated to `sovgrant` (Fastify identity service, code prefix `sg`).
Package manager: **pnpm**. TypeScript strict mode.

## Current Status (2026-11-10)

Phases 0-5 and 7 complete; the repo builds clean and has a Vitest suite.
What remains is the Phase 6 frontend page build-out.

- Phase 0-5 ✅ - docs, core infra, flow unification, auth consolidation, route fix pass, edge middleware
- Phase 6 🔲 - pages (landing, onboarding, dashboard) - deferred; consider reusing SovGrant's onboarding feature
- Phase 7 ✅ - polish & verify (ESLint CLI, proxy rename, Vitest auth/flow/error suite)

Details in `docs/relnex-roadmap.md`. Each phase is independently compilable and mergable.

## Route Handler Pattern (MANDATORY)

```typescript
import { handleApiRoute } from "@/lib/errors";
import { requireAuth } from "@/core/auth";
import { NextRequest, NextResponse } from "next/server";

export const GET = handleApiRoute(async (req, { params }) => {
  const session = await requireAuth(req); // or requireOnboarded
  return NextResponse.json({ success: true, data: result });
});
```

`handleApiRoute` awaits Next 16's async `params` and centralizes error handling.

## Critical Import Rules

| Import | Must be from | Never from |
|--------|-------------|------------|
| Auth guards | `@/core/auth` | `@/domains/auth/` |
| Error handling | `@/lib/errors` | individual files (client code uses the leaf `@/lib/errors/api-error`) |
| Prisma | `@/core/db` | `@/lib/useful/db-client` |
| Flows | `@/core/flows` | individual flow files directly |
| Sg SDK | `@/lib/sg` | individual client files |

## Workflow Rules

1. **Routes never contain business logic.** Business logic lives in Domains (flows/services/repositories).
2. **Flows are objects, not classes.** Import the named export, never call `new Flow()`.
3. **Services take `(db: DbClient = prisma)`** - default uses singleton, pass `ctx.db` for transactions.
4. **Errors are always `ApiError` static helpers.** Never `throw new Error()`.
5. **handleApiRoute wraps every API route.** Always.
6. **requireAuth for authenticated routes. requireOnboarded for provisioned-user routes.** Never skip guards.

## Identity Model

SovGrant is the canonical IdP; Relnex is a relying party keyed by `User.identityId`.
Identity-level account management routes through SovGrant; product profile/preferences
stay in Relnex. See `docs/identity-model.md`.

## Auth Notes

- Token verification goes through one seam: `verifySgToken` (`@/core/auth/jwt`).
  It prefers **JWKS/RS256** when `SG_JWKS_URL` is set and falls back to the shared
  `SG_JWT_SECRET` (HS256) for local dev / e2e. Algos are pinned per mode.
- **Blocker before JWKS works end-to-end:** SovGrant's JWKS publishes the tenant
  VC/DID keys, not the RSA access-token signing key, and access tokens carry no
  `kid`. See `docs/identity-model.md`. Do not assume the shared secret is permanent.
- `src/proxy.ts` (Next 16 rename of `middleware.ts`) forwards `x-tenant-id` /
  `x-identity-id` from the verified JWT and gates protected page prefixes.
