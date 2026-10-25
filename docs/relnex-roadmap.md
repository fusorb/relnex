# Arcbase v0.1.0 Roadmap — Architecture Alignment

> Arcbase is the knowledge-graph content management layer of the Arcevo ecosystem.
> Auth is fully delegated to **Arc-ID** (separate Fastify service). arcbase owns User
> profile, Resources, Collections, Comments, Tags, Search, and Activity.

---

## Current State (2026-07-27)

### What Works

| Layer | Status | Details |
|-------|--------|---------|
| Prisma schema | ✅ **Final** | 16 models, 10 enums, `User.identityId` bridge to arc-id. No schema changes needed. |
| Domain layers | ✅ **Functional** | Resources (14 flows), Collections (4 flows), Users (3 flows), Auth (2 flows), Search, Uploads, Tags, Comments (partial), Activity (types) |
| Auth infrastructure | ⚠️ **Partial** | `core/auth/` has JWT verify, session, cookies, guards — but routing layer never wired correctly |
| API routes | 🔴 **37/39 broken** | Missing `requireAuth`, `requireOnboarded`, `handleApiRoute` — every guarded route will fail at import time |
| Frontend pages | ⚠️ **Partial** | Login/Register complete. Landing (empty), Onboarding (empty), Dashboard (missing). |
| Auth context/providers | ✅ **Complete** | AuthProvider, QueryClient, Theme, Toaster all wired. |
| Documentation | 🔴 **None** | No CLAUDE.md, AGENTS.md, or architecture docs matching arc-id/arc-wallet patterns |

### Auth Architecture

```
Arc-ID (Fastify :4000)              Arcbase (Next.js :3000)
┌──────────────────────┐           ┌──────────────────────────┐
│  Owns: Identity,     │  JWT      │  Owns: User, Resource,   │
│  LocalAccount,       │  ◄─────── │  Collection, Comment,    │
│  Session, MFA,       │  shared   │  Tag, Activity           │
│  Passkey, OAuth      │  secret   │                           │
│                      │           │  Bridge: User.identityId │
│  arc-id Identity     │           │  = arc-id Identity.id    │
│  (id, primaryEmail,  │           │  (string ref, no FK)     │
│   status, mfa, ...)  │  Webhook  │                           │
│                      │  ──────►  │  Webhook: identity sync  │
└──────────────────────┘           └──────────────────────────┘
```

JWTs issued by arc-id → verified locally in arcbase via `jose` + shared `ARCID_JWT_SECRET` → no network call on every request. This is **identical to Clerk's model**.

---

## Workstreams (Ordered by Dependency)

| # | Workstream | Phase | Why This Order |
|---|---|---|---|
| 0 | **Documentation** | Phase 0 | Define the contract before changing anything |
| 1 | **Core Infrastructure** | ✅ Phase 1 | `requireAuth`, `requireOnboarded`, `handleApiRoute` created |
| 2 | **Flow Unification** | ✅ Phase 2 | All 13 flow-using routes use object-style flows |
| 3 | **Auth Consolidation** | 🔲 Phase 3 | Delete duplicate auth code, single source of truth |
| 4 | **Route Fix Pass** | ✅ Phase 4 | All 39 route files fixed — imports, guards, patterns unified |
| 5 | **Edge Middleware** | Phase 5 | Tenant header forwarding |
| 6 | **Pages** | Phase 6 | Landing, Onboarding, Dashboard |
| 7 | **Polish & Verify** | Phase 7 | Build check, typecheck, lint, end-to-end auth test |

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
