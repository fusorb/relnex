# Relnex: Episodic Canon

> (what changed, how it evolved, what survived) - local tracker

Purpose: a living narrative of how this repo reached its current state.
Canonical facts live in README/CLAUDE.md/docs; this file lives in the
head between sessions. Mantra: evolution is the only option.

================================================================================

EP 01 -- Create Next App → NexaShelf
--------------------------------------------------------------------------------
What happened:
  `ac2d020` scaffolds the repo from Create Next App. `429bc55` names the
  first prototype "NexaShelf" and adds pnpm + Tailwind + shadcn/ui. The
  product concept - a knowledge graph content engine - is present from
  the first commit, but the brand churns through several names before
  settling.

What survived:
  The stack never changes after this: Next.js (App Router), pnpm,
  TypeScript strict, Prisma/PostgreSQL, Tailwind. Every later rename is
  a namespace problem, not an architecture problem.

================================================================================

EP 02 -- The Arcbase Build-Out
--------------------------------------------------------------------------------
What happened:
  Commits `611164a` → `b91411f` + `a58ef5e` build the domain backbone:
  14 resource flows, collections, users, auth, comments, tags. The app
  is branded "Arcbase" and auth is delegated to a sibling service named
  "arc-id" (later SovGrant). `User.identityId` becomes the permanent
  bridge - a string reference to the identity service with no FK.

What changed (the evolution):
  - Routes are pulled out of business logic; domains own DTO/service/
    repository/flows.
  - The Flow system lands as **objects, not classes** - `Flow<I, O>`
    with `flowExecutor.run(flow, input, ctx)`.
  - Error handling centralizes on `ApiError` static factories +
    `handleApiRoute`.

What survived:
  `User.identityId`, the JWT `sub` claim, the flow-object shape, and the
  route-handler wrapper are all still load-bearing today.

================================================================================

EP 03 -- The Facet SDK Integration (arc-ui → facet)
--------------------------------------------------------------------------------
What happened:
  `7cd8d69` "repo update with facet integration" pulls in the shared UI/
  SDK packages - at that point published under `@arcevo/facet-*`. The
  repo gains wrappers under `src/lib/facet/` (SDK factories, client
  factory) and `src/lib/arcid/` (a hand-written HTTP client for the
  identity service).

What changed:
  - `@/lib/facet` wraps the typed SDKs (`AuthSdk`, `TenantSdk`, ...).
  - `@/lib/arcid` remains a parallel, hand-rolled client - the seed of
    the later "two competing auth systems" problem.
  - UI primitives start importing from the shared components package.

What survived:
  The wrapper pattern (`src/lib/facet` → typed SDKs) survives. The
  duplicate hand-written `arcid` client does not (see EP 06).

================================================================================

EP 04 -- The Great Cleanup
--------------------------------------------------------------------------------
What happened:
  `fa746fc` "chore: clean codebase" mass-deletes 38 shadcn/ui component
  files under `src/components/ui/` plus `GraphVisualizerPreview.tsx`.
  The hand-rolled UI layer is replaced by `@fusorb/facet-components`.

What changed:
  - The repo stops owning UI primitives; the shared package owns them.
  - `src/components/ui/` is emptied; shared/layout/home components remain.

What survived:
  `@fusorb/facet-components` becomes the single source of UI truth.
  This is the first namespace-driven deletion - a pattern repeated in
  the full migration (EP 06).

================================================================================

EP 05 -- The Fusorb Namespace (arcevo → fusorb)
--------------------------------------------------------------------------------
What happened:
  `package.json` moved the facet packages from `@arcevo/facet-*` to
  `@fusorb/facet-*` and bumped them (`facet-auth` 2.0.0, `facet-components`
  3.1.0, `facet-layout` 1.6.0, `facet-sdk` 2.0.0, `facet-store` 1.0.2,
  `facet-tokens` 1.5.0). But the source code still imported
  `@arcevo/facet-*` - the classic half-migration: dependency manifest
  updated, import sites not.

What changed (this migration):
  Every `@arcevo/facet-*` import across `src/` was rewritten to
  `@fusorb/facet-*`. The installed SDK also renamed its public surface:
  `ArcIdClient` → `SgClient`, `ArcProvider` → `SgProvider`,
  `WebhookSdk` → `WebhooksSdk`. All call sites followed.

What survived:
  The facet package *names* survive (`facet-components`, `facet-sdk`,
  etc.) - only the scope and the SovGrant-facing identifiers changed.

Lesson: a dependency manifest that moves before its import sites is a
half-migration. When a package renames its exports, grep the whole tree,
not just the package that introduced the name.

================================================================================

EP 06 -- arc-id → SovGrant, the `sg` Prefix, and Dead-Code Deletion
--------------------------------------------------------------------------------
What happened:
  The identity service was de-branded from "arc-id" to **SovGrant**, and
  the repo-wide code prefix standardized on `sg` (SovGrant's internal
  two-letter code - easier to type and remember than spelling it out).

  Files and folders were renamed with git history preserved:
  - `src/lib/arcid/` → `src/lib/sg/`
  - `src/app/api/webhooks/arcid/` → `src/app/api/webhooks/sg/`
  - `.env.arcid.example` → `.env.sg.example`

  Symbols and identifiers were migrated:
  - `arcid` / `sovgrant` client object → `sg`
  - `ArcIDError` / `SovGrantError` → `SgError`
  - `ArcIDIdentity` / `SovGrantIdentity` → `SgIdentity`
  - `verifyArcIDToken` / `verifySovGrantToken` → `verifySgToken`
  - `ArcIDTokenPayload` / `SovGrantTokenPayload` → `SgTokenPayload`
  - cookies `arcid_at/rt/sid` → `sg_at/rt/sid`
  - env `ARCID_*` / `SOVGRANT_*` → `SG_*`
  - webhook signature header `x-arcid-signature` → `x-sovgrant-signature`

  Dead code verified unused and deleted:
  - `src/stores/` (old Zustand wrappers)
  - `src/components/auth/` (unused facet-auth wrappers)
  - `src/components/layout/{FacetLayout,index,protected-route}`
  - `src/jobs/` (empty stubs)
  - `src/lib/activity/` (unreferenced logger)
  - `scaffold.js`, `gen-snapshot.js` (one-off scaffold/snapshot scripts)

What changed (brand):
  - App name: Arcbase → **Relnex** (everywhere: docs, config, UI copy).
  - Ecosystem: Arcevo → **Fusorb**.
  - Identity service: arc-id → **SovGrant** in prose, `sg` in code.
  - Docs renamed: `docs/arcbase-roadmap.md` → `docs/relnex-roadmap.md`.

What survived:
  The app name "Relnex" and the `sg` code prefix are now canonical.
  `src/lib/sg` is the single identity-service HTTP client; the facet SDK
  wrappers (`src/lib/facet`) remain the typed-SDK layer on top.

Rule: prose says SovGrant, code says `sg`/`Sg`/`SG_`. If a consumer sees
"arc-id" or "ArcID" anywhere in this tree, the migration is incomplete.

================================================================================

EP 07 -- The Naming Canon (reflection)
--------------------------------------------------------------------------------
The arc of this repo's names:

  repo/product:  Create Next App → NexaShelf → Arcbase → **Relnex**
  identity:      (unnamed) → arc-id → SovGrant (code prefix `sg`)
  UI/SDK:        (hand-rolled shadcn) → arc-ui → facet (`@fusorb/facet-*`)
  wallet:        arc-wallet → **SovPort** (sibling repo, not this one)

Every rename followed the same rule: update the manifest AND the import
sites AND the docs AND the env templates in one sweep, then delete the
dead wrappers the rename left behind. A rename is never just a string
replace - it is the moment to delete the code that only existed to wrap
the old name.

State: namespace migration complete. Source grep returns zero `arcbase`,
`arc-id`, `ArcID`, `ARCID`, or `@arcevo` references outside `.agent/`
history and generated Prisma artifacts.

================================================================================

EP 08 -- Sg SDK migration: hand-rolled client -> @fusorb/facet-sdk
--------------------------------------------------------------------------------
What happened:
  The identity-service boundary stopped being hand-rolled. `src/lib/sg/client.ts`
  previously carried its own `sgFetch` wrapper plus `sg.register/login/...`
  methods. It now re-exports `SgClient` / `AuthSdk` from `@fusorb/facet-sdk`
  and adds only what Relnex owns: `createServerSgClient()` (base URL + M2M
  service token), an `unwrap()` helper for the SDK's `ApiResponse<T>` envelope,
  and the local `SgError`.

What changed:
  - `src/lib/facet/` (SDK factory wrappers) deleted - dead once the Sg boundary
    re-exported the SDK directly.
  - `authService.register/login` became `new AuthSdk(createServerSgClient())` +
    `unwrap(...)`. The other auth pass-through methods (mfa, logout, refresh,
    password reset) were dropped from the service.
  - `login.flow` now derives `expiresIn` from the SDK result (fallback 900)
    instead of a hard-coded constant.

What survived:
  `SgError` stays as the local error type, and `verifySgToken` remains the single
  seam for token verification. `@/lib/sg` is the only place that touches the SDK.

Lesson: a hand-written HTTP client is a liability the moment the upstream ships a
typed SDK. Re-export, don't re-implement - keep only the glue the app actually owns.

================================================================================

EP 09 -- Stabilization: build gate, async params, client/server split
--------------------------------------------------------------------------------
What happened:
  Running the real build (`next build`) surfaced three defects that `tsc` alone
  had not, because `.next/types` did not yet exist:

  1. Next 16 passes route `params` as a Promise. Dynamic routes were typed
     synchronously, so the generated route validator failed. Fixed centrally in
     `handleApiRoute`: the wrapper now awaits `params` and hands handlers the
     resolved value - no per-route churn.
  2. Two route-group pages (`(public)/page.tsx`, `(onboarding)/onboarding/page.tsx`)
     were empty files, which Next rejects as "not a module". Replaced with minimal
     valid pages (full rebuild deferred to Phase 6).
  3. `pg` (Node-only: `dns`, `fs`, `net`, `tls`) leaked into the CLIENT bundle:
     `api-client.ts` imported `ApiError` from the `@/lib/errors` barrel, which also
     re-exports the server-only `handleError -> @/core/flows -> prisma -> pg` chain.
     Fixed by importing the leaf `@/lib/errors/api-error` from client code.

What changed:
  - `handleApiRoute` unwraps async `params`.
  - Client error imports go through the leaf module, never the barrel.
  - Landing + onboarding placeholders added; `next build` now compiles 27 static
    pages and all 40 routes.

What survived:
  The route-handler/flow architecture is unchanged. The lesson is that a barrel
  file is a server/client boundary hazard: re-exporting a server module makes it
  trivially importable from a client component.

Lesson: `tsc` is necessary but not sufficient. The build gate (and the generated
`.next/types`) catches framework-contract breaks that a plain typecheck misses.

================================================================================

EP 10 -- Phase 5 middleware, dash purge, and the pause
--------------------------------------------------------------------------------
What happened:
  Phase 5 (edge middleware) closed. `src/middleware.ts` now verifies the SovGrant
  JWT from the `sg_at` cookie or `Authorization` header, then forwards `x-tenant-id`
  (JWT `tid`) and `x-identity-id` (JWT `sub`) into the downstream request, while
  still redirecting unauthenticated users away from protected page prefixes. It
  imports `verifySgToken` from the edge-safe leaf (`@/core/auth/jwt`), not the
  barrel, to stay off the Prisma import graph.

  A house style decision landed: em/en dashes are purged from source and docs in
  favor of plain hyphens (punctuation-only sweep).

  Then development was **intentionally paused**. SovGrant is the moving target;
  rather than build Phase 6 pages against an unstable auth surface, the decision
  was to freeze Relnex at a green, documented state and sync all canon first.

What changed:
  - `src/middleware.ts` - tenant/identity header forwarding.
  - Em/en dashes removed across `src/` and the docs.
  - README / AGENTS / CLAUDE / docs/architecture / roadmap / these episodes and
    the tracker all realigned to the repo state (14 models, 9 enums, 40 routes,
    9 domains).

What survived:
  Phases 0-5 are complete and the repo builds clean. Phase 6 (pages) and Phase 7
  (polish) are the remaining work, to resume once SovGrant stabilizes.

State: paused at a green checkpoint. `pnpm build` compiles; `pnpm typecheck`
passes; docs and trackers are in sync. Identity verification still uses the shared
secret pending the JWKS migration (user-owned; `verifySgToken` is the seam).

================================================================================

EP 11 -- The audit: SG contract, dead-code purge, and sync gates
--------------------------------------------------------------------------------
What happened:
  A full-repo audit was run before resuming Phase 6. It found the repo
  self-inconsistent in four ways: retired names still live, docs drifted from
  reality, dead code left behind by earlier renames, and no gates to catch any of
  it again.

  The sharpest finding: the **live `.env` was still on the retired `ARCID_*`
  contract** while the source reads `SG_*` - so `SG_JWT_SECRET` and
  `SG_WEBHOOK_SECRET` (both non-null asserted) would throw locally and auth was
  broken on any fresh clone.

What changed:
  - **Env contract.** `.env` + `.env.example` aligned on `SG_*`; `SG_ISSUER`,
    `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STORAGE_PUBLIC_URL` documented; the
    duplicate `.env.sg.example` deleted; secret backups (`.env.bak-*`,
    `.env.dbname-*`) removed; `docs/environment.md` added as the canonical contract.
  - **Legacy purge.** No `arcbase` / `arc-id` / `ArcID` / `arcevo` outside
    `.agent/episodes.md` and the new `.agent/archive/` (the superseded AUDIT and the
    DB-access plan now live there). `components.json` (shadcn scaffold) deleted.
  - **Dead code.** Removed the duplicate `DbClient`, unused barrels, `guards.ts`,
    `prisma-helpers.ts`, the engagement save/unsave duplicates + `saved-resource.*`,
    and unused hooks/components. Coherent-but-unrouted code (engagements
    reactions/follows, the protected layout) was kept for Phase 6.
  - **Sync gates.** `scripts/check-{docs-sync,legacy-names,env-sync,boundaries}.mjs`
    + `pnpm check:all` + a `.github/workflows/ci.yml`, mirroring facet. Docs now
    carry counts that `check:docs` verifies.
  - **Hardening.** `api-client` maps HTTP status to the right `ApiError` (was always
    500); baseline security headers added; webhook idempotency via a dedupe table.
  - **Docs/trackers** re-synced to the real state: 15 models, 9 enums, 40 routes,
    9 domains. `docs/capacity-and-fragmentation.md` records the 5-year stress-test.

What survived:
  The architecture is unchanged - routes -> flows -> services -> repositories,
  `handleApiRoute` + guards, `User.identityId` as the bridge. The lesson is the one
  EP 05/06 already taught: a rename is a manifest + import sites + docs + env sweep,
  and it is not done until a gate fails when it regresses. This pass makes the gate.

State: green at a paused checkpoint, now with drift gates. Identity verification
still uses the shared secret pending the JWKS migration (`verifySgToken` seam).
