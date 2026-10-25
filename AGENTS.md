# Relnex — Agent Instructions

> Loaded automatically every session. For the full handbook — architecture,
> patterns, and rules — see `CLAUDE.md` and `docs/architecture.md` in this root.

---

## What Relnex Is

Next.js 15 knowledge-graph app. Auth delegated to `sovgrant` (Fastify identity service, code prefix `sg`).
Package manager: **pnpm**. TypeScript strict mode.

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

## Critical Import Rules

| Import | Must be from | Never from |
|--------|-------------|------------|
| Auth guards | `@/core/auth` | `@/lib/sg/middleware`, `@/domains/auth/` |
| Error handling | `@/lib/errors` | `@/lib/errors/handle-error` (individual file) |
| Prisma | `@/core/db` | `@/lib/prisma` (doesn't exist) |
| Flows | `@/core/flows` | individual flow files directly |
| SG SDK | `@/lib/sg` | only for HTTP client calls |

## Workflow Rules

1. **Routes never contain business logic.** Business logic lives in Domains (flows/services/repositories).
2. **Flows are objects, not classes.** Import the named export, never call `new Flow()`.
3. **Services take `(db: DbClient = prisma)`** — default uses singleton, pass `ctx.db` for transactions.
4. **Errors are always `ApiError` static helpers.** Never `throw new Error()`.
5. **handleApiRoute wraps every API route.** Always.
6. **requireAuth for authenticated routes. requireOnboarded for provisioned-user routes.** Never skip guards.

## Current Rebuild Status

See `docs/relnex-roadmap.md` for the phased rebuild plan. Work is ordered by dependency:

- Phase 0 ✅ — Documentation (this file + CLAUDE.md + docs/)
- Phase 1 ✅ — Core infrastructure (requireAuth, handleApiRoute)
- Phase 2 ✅ — Flow unification (object style)
- Phase 3 🔲 — Auth consolidation (delete duplicates)
- Phase 4 ✅ — Route fix pass (39/39 files) — all imports fixed, guards unified
- Phase 5 🔲 — Edge middleware
- Phase 6 🔲 — Pages (landing, onboarding, dashboard)
- Phase 7 🔲 — Polish & verify

Each phase is independently compilable and mergable. Never skip phases.
