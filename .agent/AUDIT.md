# arcbase - Full Codebase Audit

> **⚠️ HISTORICAL / SUPERSEDED (2026-10-31).** This audit describes the repo as
> "arcbase" (now **Relnex**) mid-rebuild, before the SovGrant/`sg`/Fusorb namespace
> migration and the Phase 3-5 work. Most findings below are resolved. Current state
> lives in `docs/relnex-roadmap.md`; the tracker is `.agent/todo.txt`.
>
> Resolved since this audit: error-handling chain (FlowError now mapped by
> `handleError`); `users/[username]` route signatures; login route sets auth cookies;
> `api-client` error mapping; auth consolidation onto `@fusorb/facet-sdk`; all 40
> routes unified; `pnpm typecheck` and `pnpm build` green. The shared-secret -> JWKS
> verification swap remains user-owned.

**Date:** 2026-09-10  
**Scope:** Entire repository (root, `src/`, `prisma/`, configs, deps)  
**Status:** Historical snapshot (see banner above)

---

## 1. Executive Summary

The codebase is **mid-rebuild**. Phase 0-2 (docs, core infrastructure, flow unification) are complete.
The new architecture - `@/core/` (auth, db, flows) + domain-driven flows + `handleApiRoute` wrapper - is
solid and consistent across most route handlers. However, **the codebase does NOT compile** due to:
1. Type mismatches from an incomplete service refactor (`UserService` signatures changed but routes not updated)
2. Error-handling chain is broken (`FlowError` not handled by `handleError`)
3. Missing/broken imports from un-migrated domains (`comments` PATCH/DELETE, `search`, `tags`)

The auth flow is **completely broken at runtime** - the login route never sets auth cookies.

The UI layer was mass-deleted (38 shadcn component files removed) but replacement pages are **empty stubs**.
The `@arcevo/facet-*` packages are massively underutilized - only `facet-tokens` and `facet-components`
are meaningfully used. The rest (`facet-auth`, `facet-layout`, `facet-store`, `facet-sdk`) exist as
dependencies with wrapper files that are either dead code or underused.

**Bottom line:** Stabilize the backend first (fix the 7 critical bugs below), then fully rebuild the UI
from scratch using `@arcevo/facet-components` + `@arcevo/facet-layout` + `@arcevo/facet-auth`.

---

## 2. What's Perfect

### Core Architecture (`@/core/`)
- **`@/core/auth/`** - JWT verification via `jose`, cookie management (`auth-cookie.ts`), session
  resolution (`get-session.ts`), two-tier guards (`requireAuth` → `requireOnboarded`), decorator-style
  guards (`withAuth`/`withUser`/`withScope` in `guards.ts`). Clean separation.
- **`@/core/db/`** - Prisma v7 adapter pattern (`@prisma/adapter-pg`), connection pooling
  (20 connections prod / 10 dev), `prisma-helpers.ts` with split-query optimization for comments.
- **`@/core/flows/`** - `Flow` interface (object-based, not class-based), `FlowExecutor` with automatic
  Zod validation + Prisma `$transaction` wrapping + requestId tracing, `DbClient` type unification.
  Every flow takes `ctx.db` from context, every route passes minimal `InboundCtx`.

### Domain Layer (`@/domains/`)
- 8 domains with correct structure: DTO → Service → Repository → Flow → Presenter
- **Resources domain** is the most complete: 14 flows covering CRUD, versioning, publishing,
  tagging, usage tracking, commenting, saving, and resource-to-resource connections.
- **`prisma-helpers.ts`** (`src/domains/resources/resource.repository.ts`) demonstrates
  thoughtful query optimization: `commentWithAuthor` vs `commentWithAuthorAndReplies` -
  avoids N+1 by splitting into base + nested includes.

### Prisma Schema (`prisma/schema.prisma`)
- 14 well-designed models with proper relations
- Soft deletes (`deletedAt`), RBAC roles, onboarding state, resource types/visibility/status enums
- Many-to-many relations (Save, Follow, Reaction, Tag, Relation, Membership)
- `ResourceMetrics` for telemetry (viewCount, saveCount, likeCount, timeToRead)
- `ResourceUsage` for per-user usage tracking
- `Relation` model for directed graph edges (source → target with type)

### API Layer (`src/app/api/`)
- All 39+ route files follow the identical pattern:
  `handleApiRoute` → `requireAuth`/`requireOnboarded` → `flowExecutor.run()` → `NextResponse.json({ success, data })`
- Consistent error boundary via `handleApiRoute`
- OpenAPI spec (`src/lib/useful/openapi.ts`) - ~2100 lines, documents all endpoints
- `api-docs/page.tsx` - production-ready Swagger UI with auth token support

### Build & Tooling
- `pnpm` workspace + strict TypeScript
- `prisma generate` in `postinstall`
- `next dev --turbopack` for fast development
- Tailwind v4 with OKLCH color tokens + `@arcevo/facet-tokens`

---

## 3. CRITICAL BUGS (Fix Before Compilation)

### BUG 1: Login route never sets auth cookies
**File:** `src/app/api/auth/login/route.ts`  
**Impact:** **All client-side auth is broken.** Users cannot log in and maintain a session.

The `loginFlow` returns `{ accessToken, refreshToken, sessionId, expiresIn }`. The route handler
returns these tokens in JSON but **never calls `setAuthCookies()`**. The `auth-context.tsx`'s
`refresh()` → `/api/auth/me` chain fails with 401 because no `arcid_at` cookie exists.

The login flow even has a comment: `// Caller (route handler) sets cookies` - but the route
handler doesn't do this.

**Fix:** Call `setAuthCookies(result.accessToken, result.refreshToken)` before returning the response.
Also set the session ID cookie if applicable.

### BUG 2: Error handling chain is broken - all flow errors return 500
**Files:** `src/core/flows/flow-executor.ts` + `src/lib/errors/handle-error.ts` + `src/lib/errors/handle-api-route.ts`

- `FlowExecutor.run()` catches ALL errors (including `ApiError`, `ZodError`, `ArcIDError`) and re-wraps
  them as `FlowError("FLOW_ERROR", message, 500)`.
- `handleError()` (called by `handleApiRoute`) handles `ApiError`, `ArcIDError`, `ZodError` - but
  **does NOT handle `FlowError`**. It falls through to the generic `Error` case → `500 INTERNAL_SERVER_ERROR`.

Result: validation errors (should be 400), conflicts (should be 409), not-found (should be 404) all
return 500. **No client can distinguish error types from any flow-based endpoint.**

**Fix:** Import `FlowError` in `handleError` and handle it by returning `{ success: false, error:
{ code, message } }` with `err.statusCode`. Alternatively, make `FlowExecutor` only catch unexpected
errors (not `ApiError`/`ZodError`/`ArcIDError`).

### BUG 3: Three route handlers return undefined data (return-shape mismatches)
All are confirmed from reading both the route AND the flow:

| Route | Accesses | Flow Returns | Result |
|---|---|---|---|
| `users/route.ts` PATCH | `result.user` | `{ user }` ✓ (but input is wrong, see BUG 4) | `undefined` |
| `users/me/profile/route.ts` PUT | `result.profile` | `{ user }` ✗ | `undefined` |
| `resources/[resourceId]/relations/route.ts` POST | `result.edge` | `{ relation }` ✗ | `undefined` |

**Fix:** Either change the flow return shape to match the route expectation, or change the route
to access the correct field.

### BUG 4: `adminActionFlow` input mismatch - route and DTO use different field names
**Files:** `src/app/api/users/route.ts` + `src/domains/users/flows/admin-action.flow.ts` + `src/domains/users/user.dto.ts`

- Route passes: `{ targetUserId, isArchived, isDeleted }`
- Flow's `AdminActionDto` expects: `{ targetUserId, action, reason }` (enum of `ARCHIVE`, `UNARCHIVE`,
  `DELETE`, `RESTORE`)

The `action` field is required but never provided. The Zod schema will reject the input. The route
handler needs to be rewritten to map `isArchived: true/false` → `action: "ARCHIVE"/"UNARCHIVE"` and
`isDeleted: true` → `action: "DELETE"`.

### BUG 5: ALL `users/[username]/` routes crash at runtime
**Files:** `src/app/api/users/[username]/*.ts` (6 route files)  
**Root cause:** `UserService` was refactored in Phase 2 to use constructor injection
(`new UserService()` stores `this.db` via `this.repo`). Method signatures changed from
`(db, username)` to `(username)`. But the routes were **never updated**:

```typescript
// Route DOES (WRONG):
userService.getPublicProfile(prisma, params.username)
// Method EXPECTS:
async getPublicProfile(username: string) { this.repo.findByUsername(username) }
```

`prisma` (a PrismaClient) is passed where `username: string` is expected. At runtime,
`this.repo.findByUsername(prisma)` → `db.user.findFirst({ where: { username: prisma } })` → crash.

This affects: `users/[username]/route.ts`, `analytics/route.ts`, `collections/route.ts`,
`graph/route.ts`, `resources/route.ts`, and `saved/route.ts`.

**Fix:** Remove `prisma` from all method calls - the service already has the db via constructor.
Change all calls to `userService.getPublicProfile(params.username)`.

### BUG 6: `api-client.ts` masks ALL HTTP error status codes as 500
**File:** `src/lib/useful/api-client.ts`

```typescript
if (!res.ok) {
  throw ApiError.internal(res.statusText); // ← always 500!
}
```

Every non-OK HTTP response (401, 403, 404, 409, 400) is thrown as `ApiError.internal` (500).
The client-side code cannot distinguish error types. Login failures, rate limiting, permission
errors - all appear as 500 Internal Server Error.

**Fix:** Map HTTP status codes to appropriate `ApiError` static helpers:
- 401 → `ApiError.unauthorized()`
- 403 → `ApiError.forbidden()`
- 404 → `ApiError.notFound()`
- 409 → `ApiError.conflict()`
- 422 → `ApiError.unprocessable()`
- 5xx → `ApiError.internal()`

### BUG 7: `auth/me` route - type error and bypassed flows
**File:** `src/app/api/auth/me/route.ts`

1. Uses `requireAuth(req)` which returns `AuthSession` where `userId: string | undefined`
   (since the User record might not exist yet). But `authService.getProfile(prisma, userId)`
   expects `userId: string`. **TypeScript strict mode error.**

2. The route bypasses the flow executor entirely - calls `authService.getProfile()` directly,
   passing the raw `prisma` client. No transaction wrapping, no structured logging.

3. `session.userId` could be `undefined` at runtime (user has arc-id identity but no User record
   yet), causing `db.user.findUnique({ where: { id: undefined } })` to crash.

**Fix:** Use `requireOnboarded(req)` (guarantees `userId: string`) and route through a flow.

---

## 4. Architectural Issues

### Two Competing Auth Systems
**OLD (being phased out):**
- `@/lib/arcid/client.ts` - hand-written axios HTTP client (58 lines) calling arc-id's REST API
- `@/stores/auth.store.ts` - Zustand store wrapping `@arcevo/facet-store`
- `@/context/auth-context.tsx` - React Context using `apiClient` (fetch-based) to call `/api/auth/*`

**NEW (current):**
- `@/core/auth/` - JWT verification, cookie management, session resolution
- `@/domains/auth/auth.service.ts` - uses `arcid` from `@/lib/arcid/client` (the OLD HTTP client!)
- Route handlers use `@/core/auth/requireAuth` guards

**Problem:** The `authService` still uses the old hand-written `arcid` client, NOT the official
`@arcevo/facet-sdk` (`@/lib/facet/`). The facet SDK wrapper exists but is only used by the OLD
stores/components. The auth service should migrate to `@/lib/facet/sdks` (which provides `AuthSdk`).

### Services Used Directly From Routes (Bypassing Flows)
The following routes call services directly, bypassing `flowExecutor.run()`:
- ALL 6 `users/[username]/` routes → `new UserService()` + `userService.method(prisma, ...)`
- `resources/saved/route.ts` GET → `new ResourceService()` + `resourceService.listSavedResources()`
- `auth/me/route.ts` → `authService.getProfile(prisma, ...)`
- All auth routes (login/register) use flows ✓ but `logout` and `me` do not

This bypasses transaction wrapping, structured logging, and FlowError handling.

### `saveResourceFlow` Directly Manipulates Prisma
**File:** `src/domains/resources/flows/save-resource.flow.ts`

Unlike other flows that instantiate a Service (`new ResourceService(ctx.db)`), `saveResourceFlow`
directly calls `ctx.db.savedResource.upsert()` and `ctx.db.resource` operations. This breaks the
consistent pattern where flows delegate to services for business logic.

Also returns `{}` (empty object) - the route gets `data: {}` as the response.

### `DbClient` Duplicated
- `src/lib/useful/db-client.ts` (3 lines) - OLD definition using `typeof prisma`
- `src/core/flows/flow-context.ts` (13 lines) - NEW definition using `PrismaClient`

The old file is still exported via `@/lib/useful` barrel and may be imported somewhere.

### `@/lib/facet/` Not Exported From `@/lib` Barrel
The lib barrel (`src/lib/index.ts`) exports `./arcid`, `./errors`, `./useful`, `./storage`, `./activity`,
and `cn` - but NOT `./facet`. This means `@/lib/facet` is only accessible via explicit path imports,
not through the barrel. Inconsistent.

### FlowExecutor Output Validation Bypassed in Multiple Flows
The `Flow` interface has optional `outputSchema`, but most flows don't define one (especially
in the resources domain). This means flow outputs are not validated before being returned to routes.

### `requireAuth` Type Mismatch
`AuthSession.userId` is `string | undefined` (user record might not exist yet).
`FlowContext.userId` is `string | null`.
When routes pass `session.userId` to `flowExecutor.run()`, TypeScript strict mode flags
`string | undefined` as not assignable to `string | null`.

Routes using `requireAuth` for write operations (comments, resource PATCH/DELETE, archive, profile)
have potential type errors OR rely on `ctx.userId!` non-null assertions inside flows.

### No `createFlowContext` Factory
`flow-context.ts` defines the `FlowContext` type but there's no `createFlowContext()` factory
function. The `FlowExecutor` creates the enriched context inline with `const enriched:
FlowContext = { ...ctx, requestId: traceId, db }`. This is fine but the pattern is not reusable.

### Two Layout Systems
- **Hand-written:** `dashboard-layout.tsx` (110 lines), `marketing-layout.tsx` (145 lines)
- **Facet-layout wrappers:** `FacetLayout.tsx` with `FacetDashboardLayout` (`ConsoleLayout` from
  `@arcevo/facet-layout`) and `FacetMarketingLayout` (`LandingLayout`)
- `src/components/layout/index.tsx` - kitchen sink exporting `PublicLayout`, `AuthLayout`,
  `AppLayout`, `FacetDashboardLayout`, `FacetMarketingLayout`
- The app routes use the hand-written layouts, NOT the facet-layout wrappers

### `Activity` Module Is Dead Code
`src/lib/activity/log-activity.ts` + `index.ts` exist but are NOT exported from `@/lib/index.ts`
and are not imported by any route or domain. It's a logging utility that was created but never wired up.

### Jobs Module Is Empty
`src/jobs/worker.ts`, `cleanup.job.ts`, `metrics.job.ts` - all empty files. No job queue infrastructure
exists (no QStash, BullMQ, or @upstash/qstash usage in actual code despite being in package.json).

---

## 5. Security Issues

### 1. Data Exposure in Public Profile Routes
**Files:** `src/app/api/users/[username]/{resources,saved,collections}/route.ts`

`UserService.getUserNestedSaved()` and `getUserNestedResources()` return ALL resources (including
drafts and private ones) regardless of the viewer. The `_viewerId` parameter is accepted but not
used (underscore-prefixed = intentionally unused). Any authenticated user can view another user's
complete saved/private resource list.

The comment in the `saved/route.ts` claims "The service enforces the ownership check" but the
code does no such check.

### 2. No CSRF Protection
The `api-client.ts` uses `credentials: "same-origin"` (correct for cookie-based auth), but:
- No CSRF token verification on state-changing operations
- The middleware doesn't check CSRF tokens
- The `next.config.ts` doesn't set `SAME_SITE` cookie attributes (though `auth-cookie.ts` does set it)

### 3. No Rate Limiting
No rate limiting on any endpoint. Brute-force attacks on `/api/auth/login` are trivially possible.
The `@upstash/ratelimit` package is NOT in the dependencies.

### 4. No Security Headers
`next.config.ts` is essentially empty - no CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
or Referrer-Policy.

### 5. Raw Prisma Models Returned in API Responses
Multiple flows and routes return raw Prisma model objects without using presenters:
- `users/me/onboarding/route.ts` - returns `result.user` (raw User model with `deletedAt`,
  `identityId`, `preferences`, `metadata`)
- `users/route.ts` PATCH - returns `result.user` (raw)
- `comments/[commentId]/route.ts` GET - returns `comment` (raw, includes `deletedAt`)
- The `authService.getProfile()` DOES use a manual field whitelist, but most other endpoints don't

### 6. `process.env` Non-Null Assertions
- `src/middleware.ts`: `process.env.ARCID_JWT_SECRET!` - crashes with cryptic error if unset
- `src/core/auth/jwt.ts`: same pattern
- `src/core/db/prisma.ts`: `process.env.DATABASE_URL!` - same

### 7. Token Refresh Not Implemented Server-Side
The login flow returns `refreshToken`, but there's no `/api/auth/refresh` route handler. The
client-side code would need to call arc-id's refresh endpoint, but no route exists for this.

### 8. No Role-Based Access Control Enforcement
The schema has `UserRole` (VIEWER/EDITOR/AUTHOR/ADMIN/SUPERADMIN) and `GlobalRole` (USER/ADMIN/SUPERADMIN),
but the route handlers don't enforce role checks. The `withScope` guard exists but is unused.

---

## 6. Dead Code & Cleanup Candidates

### Delete These Files (Verified Unused)

| File | Lines | Reason |
|---|---|---|
| `src/lib/useful/db-client.ts` | 3 | Old `DbClient` - duplicated by `@/core/flows/flow-context.ts` |
| `src/stores/auth.store.ts` | 42 | Old Zustand store; auth-context.tsx is used instead |
| `src/stores/tenant.store.ts` | 43 | Old Zustand store; not referenced anywhere |
| `src/stores/index.ts` | 3 | Barrel for unused stores |
| `src/components/auth/SignInPage.tsx` | ? | Uses `@arcevo/facet-auth` `SignIn` - not imported by login page |
| `src/components/auth/SignUpPage.tsx` | ? | Same - not imported by register page |
| `src/components/auth/UserMenu.tsx` | ? | Not imported anywhere |
| `src/components/auth/index.ts` | ? | Barrel for unused components |
| `src/components/layout/FacetLayout.tsx` | ? | Facet-layout wrappers - not imported by app routes |
| `src/components/layout/index.tsx` | ? | `PublicLayout`/`AuthLayout`/`AppLayout` - not imported by app routes |
| `src/components/layout/protected-route.tsx` | ? | Uses old auth context; not imported |
| `src/components/home/Features.tsx` | 0 | Empty file |
| `src/app/(public)/page.tsx` | 0 | Empty homepage |
| `src/app/(onboarding)/onboarding/page.tsx` | 0 | Empty onboarding step |
| `src/jobs/worker.ts` | 0 | Empty |
| `src/jobs/cleanup.job.ts` | 0 | Empty |
| `src/jobs/metrics.job.ts` | 0 | Empty |
| `src/lib/cache/` | dir | Empty directory |
| `src/lib/activity/log-activity.ts` | ? | Not exported from `@/lib` barrel; not imported anywhere |
| `src/lib/activity/index.ts` | ? | Barrel for dead module |
| `src/components/home/GraphVisualizerPreview.tsx` | - | Already deleted (git status: `D`) |
| 38× `src/components/ui/*.tsx` | - | Already deleted (git status: `D`) |

### Delete These npm Dependencies (Unused)
- `@arcevo/facet-auth` - only used in deleted/unused components
- `@arcevo/facet-layout` - only used in deleted FacetLayout.tsx
- `@arcevo/facet-store` - only used in deleted stores
- `@hookform/resolvers` - no `react-hook-form` in deps
- `framer-motion` - no motion components
- `canvas-confetti` - not used
- `@upstash/react` - not in deps but `@upstash/redis` is
- `@upstash/redis` - not used in any code
- `date-fns` - not used
- `react-day-picker` - not used
- `@radix-ui/react-icons` - might be unused (replaced by facet-components icons)

---

## 7. Missing Functionality

### Empty App Pages (Need Rebuild)
- `src/app/(public)/page.tsx` - empty, no homepage
- `src/app/(onboarding)/onboarding/page.tsx` - empty, no onboarding wizard
- `src/app/(protected)/dashboard/page.tsx` - referenced in nav but doesn't exist
- `src/app/(protected)/dashboard/layout.tsx` - might not exist

### Missing API Routes
- `/api/auth/refresh` - token refresh endpoint (no route exists; login returns refresh token but nothing uses it)
- `/api/auth/logout` - exists, calls `clearAuthCookies()`, but login never set cookies
- `/api/search` - documented in OpenAPI `PATH_GROUPS` but no route handler
- `/api/tags` - documented in OpenAPI but no route handler
- `/api/uploads` - documented in OpenAPI but no route handler (upload service exists but route missing)

### Missing UI Features
- MFA verification page (`/auth/mfa`) - login flow supports `requiresMfa` but the login page redirects to `/auth/mfa` which doesn't exist
- Password reset pages (`/auth/forgot-password`, `/auth/reset-password`) - auth service has `requestPasswordReset`/`confirmPasswordReset` but no UI or routes
- Dashboard pages - resource creation (`/resources/create/editor`, `/upload`, `/link`, `/module`), resource detail, collection management

### Incomplete Domain Implementations
- **`comments` domain** - only has read methods (`findById`, `getRootComments`, `getReplies`). No create/update/delete flows.
- **`search` domain** - service and repository exist but no flows, no routes.
- **`tags` domain** - service and repository exist but no flows, no routes.
- **`engagements` domain** - has `FollowService`, `ReactionService`, `SavedResourceService` but **no flows**. Routes in `users/[username]/` use these services directly (bypassing flows).

---

## 8. Dependency Issues

### Version Mismatches
| Package | Version | Issue |
|---|---|---|
| `@prisma/client` | `^7.5.0` | |
| `@prisma/client-runtime-utils` | `^7.8.0` | **Newer than client** - potential incompatibility |
| `next` | `16.3.4` | Next.js 16 is very new; `eslint-config-next` is at 15.5.18 |
| `eslint-config-next` | `15.5.18` | **Mismatch** with Next.js 16.3.4 |
| `eslint` | `^9` | v9 flat config but `eslint-config-next` may not support it |
| `typescript` | `^5` | Fine |
| `zod` | `^4.4.3` | Zod v4 - new API, may have breaking changes |

### Conflicting UI Dependencies
The `package.json` depends on `@arcevo/facet-components` for UI primitives (Button, Input, Label,
toast, etc.) AND has `radix-ui` - but the shadcn UI components that used `radix-ui` were deleted.
The `@radix-ui/react-icons` package may be unused.

### Missing Dev Tooling
- **No test runner** installed (`vitest`, `jest`, `@vitest/ui`, etc.)
- **No test files** anywhere in `src/`
- **No linting script** beyond `eslint . --max-warnings 2`
- **No formatting** (`prettier` not installed)
- `husky` and `lint-staged` are installed but no hooks are configured

---

## 9. Prisma Assessment

### Schema Strengths
- Comprehensive 14-model data model covering identity, tenants, resources, collections, comments,
  tags, versioning, metrics, usage tracking, social features (follow, reaction, save), notifications
- Proper soft-delete pattern (`deletedAt` field on 6 models)
- Proper enum usage: `UserRole`, `GlobalRole`, `ResourceType`, `ResourceStatus`, `ResourceVisibility`,
  `CommentStatus`, `RelationType`
- Many-to-many through tables use proper unique composite indexes (`@@unique([userId, resourceId])`)
- Full-text search vector on Resource: `tsvector` column with `@@fulltext`

### Schema Concerns
- `User.archivedAt` exists but only `deletedAt` is filtered in queries - `archivedAt` is never used
  in any repository query. Either enforce it or remove it.
- `Identity.status` field - what statuses? `ACTIVE`, `SUSPENDED`, `INVITED`? Not documented clearly.
- `Resource.usage` relation - the `ResourceUsage` model tracks per-user views. This is fine but
  could grow rapidly. No TTL/caching strategy documented.
- `Tenant.isTrial` boolean and `Tenant.trialEndsAt` - trial management is in the schema but not
  enforced in any service/route.
- Migration files: 4 migration files exist but the naming is inconsistent:
  `20250808000000_init`, `20260525095006_arcbase_db_...`, `20260528171749` (unnamed), `20260910120000`
  The unnamed migration (`20260528171749`) is suspicious.

### Generated Client
- `prisma/generated/` exists with client output (Prisma v7 format)
- `@prisma-client` path alias in tsconfig maps to `prisma/generated/index`
- `postinstall: prisma generate` regenerates on install

### Prisma Client Usage Issues
- `prisma-helpers.ts` has a comment: "split into commentWithAuthor and commentWithAuthorReplies
  to avoid N+1" - this is good optimization, but it's ONLY defined on the `ResourceRepository`.
  Other repositories (UserRepository, CommentRepository) don't use this pattern consistently.
- `UserRepository.findMany` uses `findMany` + `count` via `Promise.all` - good for pagination.
- `UserRepository.findByUsername` doesn't filter by `deletedAt` - wait, it DOES: `where: { username, deletedAt: null }`. Good.

---

## 10. Domain Stability Matrix

| Domain | DTOs | Service | Repository | Flows | Routes? | Status |
|---|---|---|---|---|---|---|
| **auth** | ✅ | ✅ (uses `@/lib/arcid/client` not facet SDK) | ✅ | ✅ (login, register) | ✅ | **Partially stable** |
| **collections** | ✅ | ✅ | ✅ | ✅ (add-resource) | ✅ | Stable |
| **resources** | ✅ | ✅ | ✅ | ✅ (14 flows) | ✅ | **Most stable** |
| **users** | ✅ | ✅ (refactored, routes NOT updated) | ✅ | ✅ (admin-action, update-profile, onboarding) | ✅ | **Routes crash at runtime** |
| **engagements** | ❌ | ✅ (3 services, no DTOs) | ❌ | ❌ (none) | Partially | **Unstable** |
| **comments** | ❌ | ✅ (read-only) | ✅ | ❌ (none) | Partially | **Incomplete** |
| **search** | ❌ | ✅ | ✅ | ❌ | ❌ | **Orphaned** |
| **tags** | ❌ | ✅ | ✅ | ❌ | ❌ | **Orphaned** |
| **uploads** | ✅ | ✅ | ❌ | ❌ | ❌ | **Incomplete** |

### Engagement Domain Specifically
- Has `FollowService`, `ReactionService`, `SavedResourceService` - all are CLASSES (not flow objects)
- Methods use `this.db` from constructor
- `FollowService` - `follow(userId, targetId)`, `unfollow(userId, targetId)`, `getFollowers(username)`, `getFollowing(username)`
- `ReactionService` - `react(userId, resourceId, type)`, `unreact(userId, resourceId)`, `getReactions(resourceId, type)`
- `SavedResourceService` - `saveResource(userId, resourceId)`, `unsaveResource(userId, resourceId)`,
  `getUserSavedResources(username, page, limit)`
- **No DTOs** - no Zod validation on any input
- **No flows** - routes in `users/[username]/` call these services directly
- The `resources/saved/route.ts` GET uses `ResourceService.listSavedResources()` (from resources domain!)
  not `SavedResourceService.getUserSavedResources()`. Two implementations of the same concept!

### Comments Domain Specifically
- `CommentRepository` - `findByResource(db, resourceId)`, `findByParent(commentId, page, limit)`,
  `findById(id)`, `findReplies(commentId, page, limit)`
- `CommentService` - `getRootComments(resourceId)`, `getReplies(commentId, page, limit)`, `findById(commentId)`
- `comments/[commentId]/route.ts` - has GET (findById) and POST (addCommentFlow reply)
- **No create/update/delete flows** for top-level comments on resources
- The `resources/[resourceId]/comments/route.ts` - GET uses `CommentService.getRootComments`,
  POST uses `addCommentFlow` (imported from `@/domains/resources`)

---

## 11. UI Assessment

### The Component Layer
The shadcn/ui component library (38 files: `accordion.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`,
etc.) was mass-deleted in the "chore: clean codebase" commit. The `GraphVisualizerPreview.tsx` was
also deleted.

What remains:
- `@/components/layout/` - 4 files (dashboard-layout, marketing-layout, FacetLayout, protected-route, index)
- `@/components/home/` - Hero.tsx (181 lines, fully built), Features.tsx (0 lines, empty)
- `@/components/shared/` - Navbar.tsx, Footer.tsx, Sidebar.tsx (all use facet-components)

### The App Router
**Page structure:**
```
src/app/
├── (auth)/
│   ├── login/page.tsx     ← Self-contained (NOT using SignInPage.tsx)
│   └── register/page.tsx  ← Self-contained (NOT using SignUpPage.tsx)
├── (public)/
│   ├── layout.tsx         ← Imports MarketingLayout (exists, hand-written)
│   └── page.tsx           ← EMPTY
├── (onboarding)/
│   └── onboarding/
│       └── page.tsx       ← EMPTY
├── (protected)/
│   ├── layout.tsx         ← Imports DashboardLayout (exists, hand-written)
│   └── [no pages]         ← No dashboard, no resource pages
├── api/                   ← 39 route handlers
├── api-docs/
│   └── page.tsx           ← Full Swagger UI (works)
├── layout.tsx             ← Root layout with Providers (AuthProvider, QueryClient, Theme)
└── middleware.ts          ← Protects /dashboard, /settings, /editor, /profile
```

### Issues
1. **Empty pages** - 3 pages are empty stubs (public homepage, onboarding)
2. **Protected routes without pages** - `/dashboard` is in the middleware matcher but has NO page
3. **Auth pages are self-contained** - don't use `@arcevo/facet-auth`'s `SignIn`/`SignUp` components
4. **Layout conflict** - hand-written `MarketingLayout`/`DashboardLayout` vs facet-layout's
   `FacetMarketingLayout`/`FacetDashboardLayout`
5. **The `protected-route.tsx` component** uses old `useAuth()` from auth-context - inconsistent with
   the server-side auth system
6. **Login page** navigates to `/onboarding` if `user.onboardingStep < 3`, but the onboarding page
   is empty
7. **Login page** checks `res.data.requiresMfa` but the login route doesn't return `requiresMfa: false`
   on the non-MFA path - the field is `undefined` (falsy, but type-wise wrong)

### The Auth Flow (Client-Side)
```
auth-context.tsx:
  login(email, password)
    → apiClient("/api/auth/login", {method: "POST", bodyData: {email, password}})
    → if !res.data.requiresMfa: refresh()
    → refresh() → apiClient("/api/auth/me") → useAuthContext
  
Problems:
  • login route doesn't set cookies → /api/auth/me returns 401
  • api-client throws ApiError.internal (500) for ALL errors → can't distinguish 401/403/404
  • login page expects res.data.user?.onboardingStep but login route doesn't return user object
```

---

## 12. The Facet Ecosystem - Full Utilization Plan

The `@arcevo/facet-*` packages are a complete design system but only partially integrated. Here's what
to fully leverage:

### `@arcevo/facet-components`
Currently used for: `cn` (className helper), Button, Input, Label, toast, Icons
**Full capacity:** Also provides Card, Dialog, DropdownMenu, Form, Select, Table, Tabs, Tooltip,
Badge, Avatar, NavigationMenu, ScrollArea, Separator, Sheet, Skeleton, Switch, Textarea - basically
a complete Radix UI + Tailwind kit. **Use these instead of rebuilding from scratch.**

### `@arcevo/facet-layout`
Currently NOT used (FacetLayout.tsx is dead code)
**Full capacity:** `ConsoleLayout` (dashboard shell with sidebar, header, mobile nav) and
`LandingLayout` (marketing page with hero, features, footer). **Use these as the foundation for
all app/layout.tsx files.**

### `@arcevo/facet-auth`
Currently only used in dead `SignInPage.tsx`/`SignUpPage.tsx`
**Full capacity:** `SignIn`, `SignUp`, `UserButton`, `ArcProvider` - pre-built auth components
that handle token management, MFA, and session state. **Replace self-written auth pages with these.**

### `@arcevo/facet-sdk`
Currently only used in `@/lib/facet/client.ts` (wrapper exists but authService doesn't use it)
**Full capacity:** `ArcIdClient`, `AuthSdk`, `TenantSdk`, `IdentitySdk`, `PasskeySdk`, `VcSdk`,
`OAuthSdk`, `BillingSdk`, `WebhookSdk`, `AuditSdk`, `ClientSdk`. **Migrate authService from
`@/lib/arcid/client` to these typed SDKs.**

### `@arcevo/facet-store`
Currently only used in dead `@/stores/auth.store.ts`
**Full capacity:** `useAuthStore`, `useTenantStore`, `usePermissionStore` - Zustand-based state
management with persistence, SSR hydration, and reactive updates. **Use these instead of
auth-context.tsx.**

### `@arcevo/facet-tokens`
Currently used in `globals.css` for CSS variables
**Full capacity:** Also provides theme switching (light/dark), component tokens, typography scale.
**Fully integrated already.**

---

## 13. Next Steps - Actionable Roadmap

### Phase 3A: Stabilize Backend (Required for compilation)

1. **Fix the error-handling chain** (BUG 2)
   - In `handle-error.ts`: import `FlowError` and add a case for it
   - OR in `flow-executor.ts`: don't catch `ApiError`/`ZodError`/`ArcIDError` - let them propagate
   - **Files:** `src/lib/errors/handle-error.ts`, `src/core/flows/flow-executor.ts`

2. **Fix `users/[username]` routes** (BUG 5)
   - Remove `prisma` as first arg from all 6 route files
   - `userService.getPublicProfile(params.username)` instead of `userService.getPublicProfile(prisma, params.username)`
   - **Files:** `users/[username]/route.ts`, `analytics/`, `collections/`, `graph/`, `resources/`, `saved/`

3. **Fix the 3 return-shape mismatches** (BUG 3)
   - Choose: either change the flow OR change the route. Flows are the source of truth.
   - `users/route.ts`: input mismatch (BUG 4) - redesign to use `action` enum
   - `users/me/profile/route.ts`: access `result.user` instead of `result.profile` (or change flow)
   - `resources/[resourceId]/relations/route.ts`: access `result.relation` instead of `result.edge`

4. **Fix login cookie bug** (BUG 1)
   - Call `setAuthCookies()` in the login route before returning
   - **File:** `src/app/api/auth/login/route.ts`

5. **Fix `api-client.ts` error masking** (BUG 6)
   - Map HTTP status codes to appropriate ApiError types
   - **File:** `src/lib/useful/api-client.ts`

6. **Delete `src/lib/useful/db-client.ts`** - old duplicate of DbClient

7. **Fix `auth/me/route.ts`** - use `requireOnboarded` instead of `requireAuth`, route through a flow

### Phase 3B: Dead Code Cleanup

Delete (verified unused):
- `src/stores/*` (entire directory - auth.store, tenant.store, index)
- `src/components/auth/*` (SignInPage, SignUpPage, UserMenu, index)
- `src/components/layout/FacetLayout.tsx`
- `src/components/layout/protected-route.tsx`
- `src/jobs/*` (entire directory - all empty)
- `src/lib/cache/` (empty directory)
- `src/lib/activity/*` (dead module)
- `src/components/home/Features.tsx` (empty)
- `src/app/(public)/page.tsx` (empty stub - will be rebuilt)

Run `pnpm install --prune` to remove unused npm dependencies
(`@arcevo/facet-auth`, `@arcevo/facet-layout`, `@arcevo/facet-store`, `@hookform/resolvers`,
`framer-motion`, `canvas-confetti`, `@upstash/redis`, `date-fns`, `react-day-picker`).

### Phase 3C: Auth System Consolidation

- Delete `@/lib/arcid/client.ts` and `@/lib/arcid/index.ts`
- Migrate `authService` to use `@/lib/facet/sdks` (AuthSdk from `@arcevo/facet-sdk`)
- Keep `@/core/auth/` (cookie/JWT/session management) as the server-side auth layer
- On the client side, use `@/lib/facet` wrappers + `@arcevo/facet-store`'s `useAuthStore`
  instead of `auth-context.tsx`
- Delete `src/context/auth-context.tsx` and `src/context/provider.tsx` auth logic
- Route `/api/auth/refresh` through a flow

### Phase 4: UI Rebuild From Scratch

**Approach:** Use `@arcevo/facet-components` (full Radix UI kit) + `@arcevo/facet-layout`
(ConsoleLayout + LandingLayout) + `@arcevo/facet-auth` (SignIn/SignUp/UserButton).

1. **Root layout** (`src/app/layout.tsx`)
   - Keep ThemeProvider, QueryClientProvider
   - Replace AuthProvider (from auth-context) with `@arcevo/facet-store`'s provider
   - Set up `metadata.ts` with proper site metadata

2. **Auth pages** (`src/app/(auth)/`)
   - Replace self-written login/register with `@arcevo/facet-auth`'s `SignIn`/`SignUp`
   - Create `/auth/mfa` page using facet-auth MFA components
   - Create `/auth/forgot-password` and `/auth/reset-password` pages

3. **Landing page** (`src/app/(public)/page.tsx`)
   - Use `FacetMarketingLayout` + `Hero` component
   - Add `Features` section (rebuild from empty stub)

4. **Dashboard** (`src/app/(protected)/dashboard/page.tsx`)
   - Use `FacetDashboardLayout` (ConsoleLayout from `@arcevo/facet-layout`)
   - Dashboard page with resource creation buttons
   - Resource creation wizard (`/resources/create/*`)
   - Resource detail/edit pages

5. **Onboarding** (`src/app/(onboarding)/onboarding/page.tsx`)
   - Use `processOnboardingStepFlow` through a flow executor
   - Step-by-step wizard using facet-components (Form, Step, Button, Input)

6. **Delete entire `src/components/` directory** after rebuilding layouts/app-pages using
   facet-layout wrappers directly. Do NOT keep the hand-written `marketing-layout.tsx` and
   `dashboard-layout.tsx` - use `ConsoleLayout` and `LandingLayout` from facet-layout instead.

### Phase 5: Testing (Post-Rebuild)

- Install `vitest`, `@vitest/ui`, `vitest-coverage`
- Write tests for: core auth, flow executor, error handling, key flows
- Add `test` script to package.json

---

## 14. Quick Wins (Do These First)

1. Fix `api-client.ts` error codes (BUG 6) - 30 min, huge UX improvement
2. Fix the 3 return-shape mismatches (BUG 3) - 15 min each
3. Fix `users/[username]` routes (BUG 5) - 30 min, fixes 6 routes
4. Fix login cookie bug (BUG 1) - 30 min, unblocks all auth
5. Fix error handling chain (BUG 2) - 30 min, proper error responses

---

## 15. Files To Read Next

- `src/domains/resources/flows/save-resource.flow.ts` (full file - saw it returns `{}`)
- `src/domains/resources/flows/update-resource.flow.ts` (not yet read)
- `src/domains/users/user.service.ts` lines 1-38 (read - confirmed constructor pattern)
- `src/domains/auth/auth.service.ts` lines 1-23 (need to see register/login flow methods)
- `src/lib/useful/api-client.ts` (full - only 24 lines, need to confirm fetch wrapper)
- `src/lib/useful/api-response.ts` (not yet read)
- `src/lib/useful/query-client.ts` (not yet read)
- All 9 unread resource flow files (`update-resource`, `delete-resource`, `disconnect-resources`,
  `unsave-resource`, `list-versions`, `get-children`, `track-usage`, `add-comment`)
