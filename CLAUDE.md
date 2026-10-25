# Relnex — AI Agent Handbook

> Version 0.1.0 — Next.js 15 App Router + Prisma/PostgreSQL + TailwindCSS v4
> Auth delegated to SovGrant (SG). See `docs/architecture.md` for full documentation.

---

## What Relnex Is

Relnex is the **knowledge graph content engine** for the Fusorb ecosystem. It's a Next.js 15 app (pnpm, TypeScript strict) where users create, organize, and discover resources (articles, notes, videos, etc.) connected by typed relations. Auth is fully delegated to **SovGrant** — a separate Fastify identity service that owns passwords, MFA, sessions, and OAuth. Relnex bridges via `User.identityId`.

**Current state:** 37/39 route files have broken imports from incomplete auth infrastructure. Core guard functions missing. See `docs/relnex-roadmap.md` for the rebuild status.

---

## Non-negotiable Rules

### Route Handler Pattern

```typescript
export const GET = handleApiRoute(async (req, { params }) => {
  const session = await requireAuth(req);       // or requireOnboarded
  // ... business logic
  return NextResponse.json({ success: true, data: result });
});
```

- ALWAYS use `handleApiRoute` from `@/lib/errors`
- ALWAYS use `requireAuth` or `requireOnboarded` from `@/core/auth`
- NEVER import from `@/lib/sg/middleware` (deprecated)
- NEVER import from `@/domains/auth/` (auth domain was scaffold, now handled by core/auth)

### Import Locations

| What | Import from | Notes |
|---|---|---|
| Auth guards (requireAuth, requireOnboarded) | `@/core/auth` | Inline functions, not HOF |
| Auth session (getSession, AuthSession) | `@/core/auth` | |
| JWT verify (verifySgToken) | `@/core/auth` | |
| Auth cookies (setAuthCookies, clearAuthCookies) | `@/core/auth` | |
| Prisma client | `@/core/db` | Singleton, not from @/lib/prisma |
| Prisma helpers (resourceWithRelations) | `@/core/db` | |
| FlowExecutor, Flow, FlowContext | `@/core/flows` | |
| ApiError, handleApiRoute, handleError | `@/lib/errors` | Barrel — not individual files |
| SG HTTP client (sg.register, etc.) | `@/lib/sg` | Only for SDK calls to SovGrant |

### Flow Pattern — Object Style

All flows export as **objects**, not classes:

```typescript
export const createResourceFlow: Flow<CreateResourceInput, ResourceDTO> = {
  name: "resource:create",
  inputSchema: CreateResourceDto,
  async execute(input, ctx) { ... },
};
```

Execute via:
```typescript
const result = await flowExecutor.run(flowObject, input, context);
```

Never use `new FlowObject()` — flows are plain objects, not constructors.

### Service Construction

```typescript
export class SomeService {
  constructor(private db: DbClient = prisma) {}
}
```

- `db` defaults to the `prisma` singleton
- Inside a Flow, pass `ctx.db` (transaction-scoped)
- Outside a Flow, the default handles it

### Error Handling

```typescript
throw ApiError.notFound("Resource not found");
throw ApiError.unauthorized("Authentication required");
// Available: badRequest, unauthorized, forbidden, notFound, conflict, unprocessable, internal
```

Never `throw new Error("message")` — always use `ApiError` static factories.

### File Naming

- Flows: `src/domains/<domain>/flows/<action>.flow.ts`
- DTOs: `src/domains/<domain>/<domain>.dto.ts`
- Services: `src/domains/<domain>/<domain>.service.ts`
- Repositories: `src/domains/<domain>/<domain>.repository.ts`
- Routes: `src/app/api/<domain>/<route>/route.ts`
- Barrel files: `index.ts` in every directory

### Domain Module Shape

Every domain in `src/domains/<n>/` owns:
- `*.dto.ts` (Zod schemas for input/output)
- `*.service.ts` (business logic wrapper)
- `*.repository.ts` (Prisma queries)
- `flows/*.flow.ts` (multi-step write operations)

### What Never Changes

- `User.identityId` — permanent bridge to SovGrant Identity.id
- JWT `sub` claim = SovGrant `Identity.id` — all middleware depends on this
- `SG_JWT_SECRET` must match between Relnex and SovGrant `.env` files
- `requireAuth`/`requireOnboarded` are the ONLY valid guard patterns

---

## Test & Build

```bash
pnpm dev          # Next.js dev server (Turbopack)
pnpm build        # Production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint
```

---

## Current Status

See `docs/relnex-roadmap.md` for the live rebuild status. This file is the compressed rules copy — keep it in sync with the roadmap.

_Last updated: 2026-10-25_
