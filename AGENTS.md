# Relnex - Agent Instructions

> Loaded automatically every session. For the full handbook - architecture,
> patterns, and rules - see `CLAUDE.md` and `docs/architecture.md` in this root.

---

## What Relnex Is

Next.js 16 knowledge-graph app. Auth delegated to `sovgrant` (Fastify identity service, code prefix `sg`).
Package manager: **pnpm**. TypeScript strict mode.

## Current Status (2026-10-31)

**Development is paused** until SovGrant is stable. Backend is stabilized and
`pnpm build` / `pnpm typecheck` are green. What remains is the frontend page build-out.

- Phase 0-5 ✅ - docs, core infra, flow unification, auth consolidation, route fix pass, edge middleware
- Phase 6 🔲 - pages (landing, onboarding, dashboard) - deferred; consider reusing SovGrant's onboarding feature
- Phase 7 🔲 - polish & verify (ESLint CLI migration, end-to-end auth test)

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

- JWT verification currently uses the shared `SG_JWT_SECRET`. The direction is to
  verify SovGrant tokens via **JWKS**; `verifySgToken` (`@/core/auth/jwt`) is the
  single seam to change. Do not assume the shared secret is permanent.
- `src/middleware.ts` forwards `x-tenant-id` / `x-identity-id` from the verified JWT.
  Next 16 deprecates the `middleware` convention in favor of `proxy` (rename tracked in Phase 7).
