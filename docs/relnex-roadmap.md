# Relnex v0.1.0 Roadmap - Architecture Alignment

> Relnex is the knowledge-graph content management layer of the Fusorb ecosystem.
> Auth is fully delegated to **SovGrant** (separate Fastify service, code prefix `sg`).
> Relnex owns User profile, Resources, Collections, Comments, Tags, and Search.

> **Status (2026-11-13).** Phases 0-5, 7, and frontend rebuild Phases A-E are
> complete. The repo is green: `typecheck`, `lint`, `test` (105), `build`, and all
> drift gates pass (validated with `@fusorb/facet-sdk` 4.0.1).
> Remaining work: rebuild Phases F-G.
> Auth verification runs through one seam (`verifySgToken`): JWKS/RS256, a pinned
> public key, or the shared secret (HS256) dev/e2e fallback.

> Counts in this file (models, enums, routes, domains) are machine-verified by `pnpm check:docs`.

---

## Current State (2026-10-31)

### What Works

| Layer | Status | Details |
|-------|--------|---------|
| Prisma schema | ✅ **Stable** | 15 models, 9 enums, `User.identityId` bridge to SovGrant. Last change: webhook idempotency ledger (EP 11). |
| Domain layers | ✅ **Functional** | Resources (13 flows), Collections (2 flows), Users (3 flows), Auth (2 flows), Engagements (4 flows, routed), Search, Uploads, Tags, Comments |
| Auth infrastructure | ✅ **Complete** | `core/auth/` JWT verify + cookies + guards; `proxy.ts` forwards tenant/identity headers; login route sets cookies. Sg boundary is `@fusorb/facet-sdk` via `@/lib/sg`. |
| API routes | ✅ **47/47 fixed** | `handleApiRoute` + `requireAuth`/`requireOnboarded` + flow executor everywhere; `tsc --noEmit` green (incl. Next 16 async `params` via `handleApiRoute` unwrap). |
| Frontend pages | 🟡 **Rebuild (A-G)** | Phases A-E done: facet shell + console/dashboard/onboarding + resource surfaces (browse, read view, create/edit, publish, uploads) + relation authoring & graph view + collections, tags, and search. Remaining: Phases F-G. |
| Test suite | ✅ **Vitest (105)** | `pnpm test` covers auth (jwt/session/guards), the flow executor, api-client error mapping, proxy gating, resource + collection read-access rules, profile visibility, the public profile graph, comment moderation, engagement rules (follow + reaction), tag rename/delete/merge, search envelopes, and the graph assembler. Runs in CI. |
| Providers | ✅ **Complete** | facet `ThemeProvider` → React Query → facet `Toaster`; session via `use-me`/`use-session`. The facet-auth `SgProvider` swap (Model A) is a later slice. |
| Documentation | ✅ **Present** | CLAUDE.md, AGENTS.md, architecture docs, and episode tracker all migrated to the Relnex/SovGrant/Facet namespace |

> **Auth verification note:** `verifySgToken` supports three trust anchors, in order:
> **JWKS/RS256** (`SG_JWKS_URL`, the target), a **pinned public key** (`SG_JWT_PUBLIC_KEY`,
> the interim that works against `sovgrant/certs/public.pem` today), then the shared
> `SG_JWT_SECRET` (HS256) dev/e2e fallback. The seam is `@/core/auth/jwt`. **Blocker:**
> SovGrant's JWKS currently publishes the tenant VC/DID keys, not the RSA access-token
> signing key, and tokens carry no `kid` - tracked in `sovgrant/.agent/todo.txt`; see
> `docs/identity-model.md`.

### Auth Architecture

```
SovGrant (Fastify :4000)              Relnex (Next.js :3000)
┌──────────────────────┐           ┌──────────────────────────┐
│  Owns: Identity,     │  JWT      │  Owns: User, Resource,   │
│  LocalAccount,       │  ◄─────── │  Collection, Comment,    │
│  Session, MFA,       │  shared   │  Tag, Activity           │
│  Passkey, OAuth      │  secret   │                           │
│                      │           │  Bridge: User.identityId │
│  SovGrant Identity   │           │  = SovGrant Identity.id  │
│  (id, primaryEmail,  │           │  (string ref, no FK)     │
│   status, mfa, ...)  │  Webhook  │                           │
│                      │  ──────►  │  Webhook: identity sync  │
└──────────────────────┘           └──────────────────────────┘
```

JWTs issued by SovGrant → verified locally in Relnex via `jose` → no network call on every
request. `verifySgToken` prefers **JWKS/RS256** (`SG_JWKS_URL`) and falls back to the shared
`SG_JWT_SECRET` (HS256) for dev/e2e (see note above).

---

## Workstreams (Ordered by Dependency)

| # | Workstream | Phase | Why This Order |
|---|---|---|---|
| 0 | **Documentation** | ✅ Phase 0 | Define the contract before changing anything |
| 1 | **Core Infrastructure** | ✅ Phase 1 | `requireAuth`, `requireOnboarded`, `handleApiRoute` created |
| 2 | **Flow Unification** | ✅ Phase 2 | All 16 flow-using routes use object-style flows |
| 3 | **Auth Consolidation** | ✅ Phase 3 | Legacy hand-rolled identity client and `sg/middleware` gone; `@fusorb/facet-sdk` is the single Sg boundary |
| 4 | **Route Fix Pass** | ✅ Phase 4 | All 47 route files fixed: imports, guards, patterns unified |
| 5 | **Edge Middleware** | ✅ Phase 5 | Tenant header forwarding (`x-tenant-id`/`x-identity-id` from verified JWT) |
| 6 | **Pages** | 🟡 Phased (A-G) | facet-based rebuild. A-E done: shell -> console/onboarding -> resources -> graph -> collections/tags/search. Remaining: F engagement (comments, saved, profiles, reactions/follows) -> G polish (api-docs re-skin, a11y, states). Onboarding reuses SovGrant's onboarding SDK. |
| 7 | **Polish & Verify** | ✅ Phase 7 | Proxy rename (Next 16), Vitest auth/flow/error suite, ESLint CLI, build check, typecheck |

---

## Route Handler Pattern (Standard)

```typescript
export const GET = handleApiRoute(async (req, { params }) => {
  const session = await requireAuth(req);
  // ... business logic
  return NextResponse.json({ success: true, data: result });
});
```

## Guard Pattern

```typescript
// src/core/auth/require-auth.ts
export async function requireAuth(req: NextRequest): Promise<AuthSession>
export async function requireOnboarded(req: NextRequest): Promise<AuthSession>
```

## Flow Pattern

All flows export as **objects** matching `Flow<I, O>` interface:

```typescript
export const createResourceFlow: Flow<CreateResourceInput, ResourceDTO> = {
  name: "resource:create",
  inputSchema: CreateResourceDto,
  async execute(input, ctx) { ... },
};
```

## Service Construction

Services take `(db: DbClient)` with a default of `prisma` singleton:

```typescript
export class ResourceService {
  constructor(private db: DbClient = prisma) {}
}
```

---

_Keep this file current. Every phase that closes an item updates this roadmap
and the corresponding docs in the same commit._
