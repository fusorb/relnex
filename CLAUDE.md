# Relnex - AI Agent Handbook

> Version 0.1.0 - Next.js 16 App Router + Prisma/PostgreSQL + TailwindCSS v4
> Auth delegated to SovGrant (SG). See `docs/architecture.md` for full documentation.

---

## What Relnex Is

Relnex is the **knowledge graph content engine** for the Fusorb ecosystem. It's a Next.js 16 app
(pnpm, TypeScript strict) where users create, organize, and discover resources (articles, notes,
videos, etc.) connected by typed relations. Auth is fully delegated to **SovGrant** - a separate
Fastify identity service that owns passwords, MFA, sessions, and OAuth. Relnex bridges via
`User.identityId`.

**Current state:** backend stable - all 41 API route files follow the standard pattern, and
`pnpm typecheck`, `pnpm build`, and the Vitest suite (89 tests) are green. The frontend rebuild
(Phase 6) is at Phases A-E done, F-G pending. See `docs/relnex-roadmap.md`.

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
- NEVER import from `@/lib/sg/middleware` (removed)
- `handleApiRoute` awaits Next 16's async `params`; keep synchronous `params` access inside handlers

### Import Locations

| What | Import from | Notes |
|---|---|---|
| Auth guards (requireAuth, requireOnboarded) | `@/core/auth` | Inline functions, not HOF |
| Auth session (getSession, AuthSession) | `@/core/auth` | |
| JWT verify (verifySgToken) | `@/core/auth` (leaf `@/core/auth/jwt` in edge code) | |
| Auth cookies (setAuthCookies, clearAuthCookies) | `@/core/auth` | |
| Prisma client | `@/core/db` | Singleton, not from `@/lib/useful/db-client` |
| FlowExecutor, Flow, FlowContext | `@/core/flows` | |
| ApiError, handleApiRoute, handleError | `@/lib/errors` | Barrel is server-only; client code imports `@/lib/errors/api-error` |
| Sg SDK (SgClient, AuthSdk, unwrap) | `@/lib/sg` | Only for SDK calls to SovGrant |

### Flow Pattern - Object Style

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

Never use `new FlowObject()` - flows are plain objects, not constructors.

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

Never `throw new Error("message")` - always use `ApiError` static factories.

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

- `User.identityId` - permanent bridge to SovGrant Identity.id
- JWT `sub` claim = SovGrant `Identity.id` - all middleware depends on this
- `SG_JWT_SECRET` must match between Relnex and SovGrant `.env` files (until the JWKS migration lands)
- `requireAuth`/`requireOnboarded` are the ONLY valid guard patterns

---

## Test & Build

```bash
pnpm dev          # Next.js dev server (Turbopack)
pnpm build        # Production build
pnpm typecheck    # tsc --noEmit
```

> `pnpm lint` currently points at `next lint`, removed in Next.js 16. Lint is being
> migrated to the ESLint CLI (Phase 7). Use `pnpm typecheck` as the green gate today.

---

## Identity Model (canonical)

SovGrant is the single IdP; Relnex is a relying party keyed by `User.identityId`.
Identity-level account management (email, password, MFA, passkeys, sessions, connected
OAuth, deletion) routes through SovGrant only. Relnex owns its product profile/preferences.
Full decision: [docs/identity-model.md](./docs/identity-model.md).

## Auth Verification Direction

`verifySgToken` (`src/core/auth/jwt.ts`) currently verifies with the shared `SG_JWT_SECRET`.
The plan is to switch to **JWKS** verification (fetch SovGrant's JWKS, verify via `jose`). This
is user-owned; `verifySgToken` is the single seam to change.

---

## Current Status

See `docs/relnex-roadmap.md` for the live rebuild status. This file is the compressed rules copy - keep it in sync with the roadmap.

_Last updated: 2026-10-31_
