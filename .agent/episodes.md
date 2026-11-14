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

================================================================================

EP 12 -- Phase 7: proxy rename, a Vitest suite, and the JWKS seam
--------------------------------------------------------------------------------
What happened:
  The polish pass closed. Three things landed, all behind existing seams.

  1. Next 16 renamed the `middleware` file convention to `proxy`. `src/middleware.ts`
     became `src/proxy.ts` and the exported function `middleware` became `proxy`
     (verified against `node_modules/next/dist/docs`). Gating and tenant/identity
     header forwarding are unchanged.

  2. A Vitest suite (sibling parity with SovGrant: `vitest@^4`) covers the load-bearing
     seams - 7 files / 42 tests: `verifySgToken` (real jose HS256 + JWKS/RS256),
     `getSession`, the guards (incl. first-login provisioning), the flow executor,
     `api-client` status-to-`ApiError` mapping, and proxy gating. Prisma and the token
     seam are mocked, so the suite needs no database or live SovGrant.

  3. `verifySgToken` now carries three trust anchors in one seam, resolved in order:
     **JWKS/RS256** (`SG_JWKS_URL`, the target), a **pinned public key** (`SG_JWT_PUBLIC_KEY`,
     the interim that works against `sovgrant/certs/public.pem` today), then the
     **shared secret (HS256)** for local dev / e2e. Algorithms are pinned per anchor.

What changed:
  - `src/proxy.ts` (rename + `proxy` export), `src/proxy.test.ts`.
  - `src/core/auth/jwt.ts` - three-anchor resolution; `SG_JWKS_URL` / `SG_JWT_PUBLIC_KEY`
    added to the env contract; `docs/environment.md` / `identity-model.md` / roadmap re-synced.
  - `vitest.config.ts` (alias-based, mirroring SovGrant; capped workers on Windows),
    `test` / `test:watch` / `test:coverage` scripts, `pnpm test` wired into CI.

The finding (why JWKS is not wired on yet):
  Reading `../sovgrant` before trusting the endpoint name paid off. SovGrant signs
  access tokens RS256 with `certs/private.pem` and declares issuer `sovgrant`, but
  its JWKS (`/api/v1/oauth/jwks`) publishes the **tenant VC/DID signing keys** (EC
  P-256), not the access-token key - and access tokens carry no `kid`. So JWKS
  verification cannot succeed against current SovGrant. Relnex keeps the shared
  secret (or a pinned public key) for dev/e2e and stays ready to flip `SG_JWKS_URL`
  once SovGrant publishes the access-token key. Logged as an SovGrant-side blocker in
  `sovgrant/.agent/todo.txt`.

What survived:
  `verifySgToken` stays the single seam; no route, flow, or service changed. The
  identity model is untouched - only the trust anchor is now switchable.

Lesson: an endpoint with the right name is not the right contract. Verify what a
sibling repo actually publishes before wiring it in; "JWKS exists" does not mean
"JWKS publishes the key that signs my token".

State: Phases 0-5 and 7 complete, suite green, gates green. Identity verification
uses the JWKS/HS256 seam; JWKS activation waits on SovGrant.

================================================================================

EP 13 -- Dissolve the frontend; rebuild on facet (Phase A)
--------------------------------------------------------------------------------
What happened:
  With auth parked behind a stable seam, the next line of action is what Relnex
  exists for: the product surface. The decision was to stop patching the
  hand-rolled UI and rebuild the frontend on `@fusorb/facet-*`.

  Reframe (why connections are the point). Relnex solves resource/knowledge
  fragmentation, not storage. Research (Glean; IBM; Bergman & Whittaker, "The
  Science of Managing Our Digital Stuff") shows the failure is architectural:
  capture-and-search fragments knowledge; the remedy is a graph of typed
  connections. The schema already models this (`Resource` node + self-hierarchy,
  `Relation` typed edges, collections, tags), and the API is complete (9 domains,
  40 routes). The gap was the UI, not the backend.

  A full product plan (Phases A-G) was written and approved: A foundation shell,
  B console + onboarding, C resources, D graph, E collections/search, F
  engagement, G polish - ordered graph-first.

What changed (Phase A):
  - Dissolved the hand-rolled frontend: marketing/dashboard layouts,
    auth-context + provider, use-auth/use-theme, the local icon registry, and the
    duplicated token block in globals.css - gone.
  - Rebuilt the shell on facet: `providers.tsx` (facet ThemeProvider -> React
    Query -> Toaster), a Next `RouterAdapter`, facet `LayoutConfig`
    (`config/layout.tsx`), `LandingLayout`, `AuthLayout` + facet-auth
    `LoginForm`, `ConsoleLayout` + dashboard, and a `use-session` hook mapping
    `/api/auth/me` to a facet `LayoutSession`.
  - Branding: `relnex-palette.css` - a consumer "knowledge" palette (deep indigo
    on near-black; indigo on paper) overriding facet's semantic tokens, following
    facet's documented "bring your own palette" pattern. No facet change needed.
  - Recorded the I/O pieces: `NEXT_PUBLIC_SG_*` for the browser SDK; docs
    (architecture map + Frontend section, roadmap, AGENTS conventions, todo).

What survived:
  The backend is untouched. Facet ownership is now explicit, and the auth seam
  (`verifySgToken`) is unchanged.

Lesson: dissolve scaffolding, not foundations. The backend already encoded the
graph; the rebuild only had to stop hiding it behind ad-hoc UI.

State: Phase A green (`pnpm typecheck` clean, `pnpm test` 45/45, gates green).
Phases B-G remain.

================================================================================
EP 14 - PHASE B: CONSOLE + ONBOARDING
================================================================================

What changed:
  - Data seam: `src/hooks/use-me.ts` (canonical `/api/auth/me` query plus a
    `requiresOnboarding` guard) and `use-resources.ts` (resource list). `use-session`
    now derives the facet `LayoutSession` from `useMe` instead of its own fetch.
  - Dashboard home: greeting, `StatCard` row, recent-resource cards with loading
    skeleton / empty / error states, quick action to `/resources/new`.
  - Console nav: kept the facet `LayoutConfig` sections and added `ComingSoon`
    placeholders (resources, collections, graph, tags, settings) so the sidebar
    never 404s. Fixed a latent icon bug: the nav used `share-2`, which `getIcon`
    cannot resolve (the registry key is `share2`), so it rendered blank.
  - Onboarding: a real wizard on Relnex's own step model (`src/lib/onboarding.ts`,
    unit-tested) persisting via `PUT /api/users/me/onboarding` and `/profile`,
    resuming from `onboardingStep`. SG-level identity onboarding plugs in through
    facet-sdk `IdentitySdk` once a flow is provisioned for Relnex in SovGrant.
  - Gated `/onboarding` and the console prefixes in `proxy.ts`.

What survived:
  Backend untouched; auth still rides the BFF cookie flow behind `verifySgToken`.

Lesson: the console is the doorway to the graph. Make the doorway real - nav plus
a data-backed home - before building the rooms.

State: Phase B green (`pnpm typecheck` clean, `pnpm test` 50/50, gates green).
Phases C-G remain.

================================================================================
EP 15 - PHASE C: RESOURCES (THE NODES)
================================================================================

What changed:
  - Read view: `(protected)/resources/[resourceId]` renders a node and its graph
    neighborhood - relations in/out (typed), hierarchy (parent + children),
    collection membership, and tags - plus a Publish action for drafts.
  - Browse: `(protected)/resources` lists nodes with type/status filters and
    pagination. Create (`/resources/new`) and edit (`/[id]/edit`) forms bind to
    the real DTOs. Uploads: presign, then PUT the bytes to the object store and
    attach the returned `fileUrl` on create.
  - Hooks: `use-resource.ts` (detail / children / create / update / publish) and
    filters on `use-resources.ts`.
  - Additive backend (a single change): `ResourceRepository.findById` now includes
    `parent`, `outgoingRelations`/`incomingRelations`, and `collections`, so the
    whole neighborhood arrives in one fetch. No new route; route count stays 40.

What survived:
  Every route handler is unchanged. The graph was already modeled - the UI just
  reads it now.

Lesson: a node is only as valuable as its edges, so the read view leads with
connections, not content. Phase D makes those edges writable.

State: Phase C green (`pnpm typecheck` clean, `pnpm test` 50/50, gates green).
Phases D-G remain.

================================================================================
EP 16 - HARDENING PASS BEFORE PHASE D
================================================================================

What happened:
  Before building the graph edges, a cleanup pass closed the bugs and gaps the CI
  lint annotations were pointing at.

What changed:
  - **Tenant scoping (real bug).** The proxy only set `x-tenant-id` when the
    verified token carried a `tid`. Otherwise a client-supplied header survived
    (spoofable), and tenant-scoped queries went unscoped (cross-tenant reads).
    The proxy now drops any client-supplied `x-tenant-id` / `x-identity-id` and
    always emits a concrete tenant via `resolveTenantId` (the reserved default
    scope). Covered by two new proxy tests.
  - **Dead code, lint to zero.** Removed the redundant `const skip` in the two
    search routes (the repository already derives skip from page/limit, so
    pagination was never broken), unused imports (FlowContext x4, ApiError,
    ResourceTag, LoginDto, ConnectResourcesInput), unused params (`ctx`, `_req`),
    the dead `resourceQueryKey` re-export, the unused `total` destructure, and the
    leftover `okJson` helper. Adopted the `^_` convention in `eslint.config.mjs`
    for intentionally-unused bindings.

What survived:
  Behaviour is unchanged for authenticated requests that already carried a `tid`.

Lesson: the CI annotations were a to-do list, not noise - one of them was a
cross-tenant read waiting to happen.

Open gap (planned, not fixed): pagination envelopes differ across the search
endpoints (`{ items, pagination }` vs `{ items, total, page, limit }`); normalize
in Phase E when search is built out.

State: lint zero, gates green, 52 tests, CI green. Phases D-G remain.

> Corrected in EP 17: this pass was incomplete. The `^_` ignore rule I added
> silenced three warnings whose root cause was real - the `_viewerId` params were
> unwired visibility filters, not dead code.

================================================================================
EP 17 - AUTHZ FIX: THE WARNINGS I HAD SILENCED WERE REAL
================================================================================

What happened:
  A re-read of the warnings I had "fixed" with the `^_` ignore rule showed the
  rule had HIDDEN three authorization gaps. `_viewerId` was accepted and silently
  ignored, so the endpoints returned more than their own comments promised.

What changed:
  - `GET /api/users/[username]/resources` served PRIVATE + DRAFT resources to
    unauthenticated / non-owner callers (its comment promised PUBLIC+UNLISTED).
    `UserService.getUserNestedResources` now filters non-owners to
    PUBLISHED + PUBLIC/UNLISTED.
  - `GET /api/users/[username]/collections` served PRIVATE collections to anyone.
    `getUserNestedCollections` now filters non-owners to PUBLIC/UNLISTED.
  - `GET /api/users/[username]/saved` claimed a 403 ownership check that did not
    exist; `getUserNestedSaved` now throws 403 unless the viewer is the owner.
  - `GET /api/resources/[resourceId]/children` (public) returned private/draft
    children; `getChildrenFlow` now takes an optional `viewerId` and hides
    non-published / private children from non-owners.
  - Regression tests: `user.service.test.ts` (7) and `get-children.flow.test.ts` (2).

What survived:
  Owner views are unchanged; only non-owner / anonymous reads are now filtered.

Lesson: never silence an "unused" warning with an ignore pattern until you have
read WHY the binding exists. `_viewerId` was not dead - it was unwired.

State: lint zero, gates green, 61 tests, CI green. Phases D-G remain.

================================================================================
EP 18 - PHASE D: RELATIONS + THE GRAPH
================================================================================

Goal: make the graph real - author typed relations, then see them.

Relation authoring (no new backend):
  - `useConnectResource` / `useDisconnectResource` over the existing
    POST/DELETE `/api/resources/[resourceId]/relations`.
  - New `ResourceConnections` component replaces the read-only card: owners get a
    Connect dialog (type Select + searchable target list) and a per-edge Remove;
    guests see the neighbourhood read-only.
  - Both mutations invalidate `["resource", id]` AND `["graph"]`, so an edit
    cannot leave the map stale.

Graph view:
  - New `GET /api/graph` (`requireOnboarded`) -> `UserService.getKnowledgeGraph`.
  - `UserService.assembleGraph` is dangling-edge-safe: a relation is only returned
    when BOTH ends resolve to a visible node, and visible external targets
    (other authors' published resources) are pulled in as nodes. The previous
    `getUserKnowledgeGraph` returned edges pointing at resources it never listed.
  - `/graph` replaces its ComingSoon placeholder: a dependency-free radial SVG
    with hover highlighting, click/Enter to open a resource, a relation legend,
    and a keyboard-accessible relation list.

Stress test:
  - `knowledge-graph.test.ts` (4) covers the empty-graph short-circuit, a dropped
    dangling edge, a dropped invisible target, and tenant scoping on both queries.
  - Verified the `--chart-*` tokens exist in the palette before painting edges (a
    missing var renders invisible edges), and confirmed `unlink`/`link` exist in
    facet's icon registry (`x` does not).

Counts moved: routes 40 -> 41 (docs synced; the docs gate enforces the number).

State: typecheck clean, 65 tests, four gates green, CI green. Phases E-G remain.

================================================================================
EP 19 - RESOURCE READ ACCESS: ONE RULE, APPLIED EVERYWHERE
================================================================================

What happened:
  Closing the gap recorded in EP 17/18 (`GET /api/resources/:id` had no visibility
  check) showed the same hole ran through every resource surface, not just one.

What was wrong:
  - `GET /api/resources`                         listed every resource in the tenant,
                                                 including other users' PRIVATE + DRAFT
  - `GET /api/resources/:id`                     any authenticated caller could read
                                                 any resource by id
  - `GET /api/resources/:id/{tags,versions,comments}`  leaked metadata and discussion of
                                                 private resources
  - `POST`/`DELETE /api/resources/:id/tags`      NO ownership check - any authenticated
                                                 user could mutate another user's tags
  - `POST /api/resources/:id/save`               bookmark anything, visible or not
  - `GET /api/resources/:id/children`            the parent's visibility was never checked

The rule (new `domains/resources/resource.visibility.ts`):
  - the author sees their own resource in any state
  - everyone else sees it only when it is PUBLISHED and not PRIVATE (PUBLIC/UNLISTED)
  - `canViewResource` for single reads, `visibleResourceWhere` for list queries
  - denial is 404, never 403, so private resources cannot be found by probing ids

Applied through `ResourceService.assertVisible` (detail, tags, versions, comments,
children, save) and `visibleResourceWhere` (list). Tag mutations now go through
`assertOwnership`. Deleted the now-unused `ResourceService.getResource`.

Tests: +11 - resource.visibility (6, the pure rule), resource.service (4, the
assertVisible/ownership wiring), get-children (1, an invisible parent 404s).
Suite: 76 tests.

State: gates green, 76 tests, CI green. Phases E-G remain.

================================================================================
EP 20 - PHASE E: COLLECTIONS, TAGS, SEARCH + ONE PAGINATION SHAPE
================================================================================

Goal: finish the "group and find" half of the product, on a single contract.

The pagination gap (recorded since EP 16) is closed:
  - three list shapes existed: `{ items, total }` (search/resources),
    `{ items, pagination: {...} }` (search/collections, search/users) and
    `{ count, data: [...] }` (collections, tags)
  - now every list endpoint returns `{ items, total, page, limit }` via
    `@/lib/pagination`, and unified search returns one such envelope PER SECTION
  - collections and tags gained real page/limit support instead of dumping everything

Found and fixed while building:
  - unified `/api/search` silently ignored `?type=` - zod stripped the unknown key,
    so the route always searched all three entities and the tab filter could never
    work. `unifiedSearchSchema` now declares `type`
  - `GET /api/collections/[collectionId]` had no visibility check - the very hole
    EP 19 fixed for resources. Added `collection.visibility.ts`; reads 404 for
    non-authors of PRIVATE collections (mutations already required ownership)
  - `/search` was missing from the proxy's protected prefixes

Surfaces:
  - `/collections` list + create dialog (the slug derives from the title), and
    `/collections/[id]` detail with add/remove of ordered resources
  - `/tags` - the taxonomy with per-tag resource counts (`_count` now surfaced
    through `toSafeTagDTO`)
  - `/search` - query input, type tabs, per-section result cards, paging

Tests: +11 (collection.visibility 8, search.service 2, proxy `/search` 1).
Suite: 87.

State: gates green, 87 tests, CI green. Phases F-G remain.

================================================================================
EP 21 - DRIFT AUDIT: A NEW SPEC GATE + PROSE FIXES
================================================================================

Asked to confirm nothing had drifted. Swept every tracker and doc; found and fixed
real drift, including a class the existing gates structurally could not see.

Fixed:
  - CLAUDE.md still claimed "all 40 API route files" and that development was
    "paused until SovGrant is stable" - both long stale
  - the docs gate matched only "N routes", so the "N route files" / "N API route
    files" phrasings slipped through. Extended the pattern; re-running it
    immediately caught a second stale count in .agent/todo.txt (40 -> 41)
  - architecture.md carried a stale tree: a lib/useful line describing files that
    are not there, "coming-soon.tsx (console placeholders)" when only /settings is
    still a placeholder, an outdated hooks list, and "(protected)/* placeholders
    keep the sidebar navigable"
  - the roadmap workstream table still described Phase 6 as "A shell (done)"

NEW GATE: check:openapi - scripts/check-openapi-sync.mjs
  Diffs the routes on disk against the path keys in src/lib/useful/openapi.ts
  (rendered by /api-docs). On its first run it found 10 undocumented routes
  (/api/graph, /api/resources/saved, /api/resources/{id}/save, the four
  /api/search/* endpoints, /api/users/me/onboarding, /api/users/me/profile,
  /api/webhooks/sg) and 2 phantom paths (/api/auth/onboarding, /api/users/profile
  - the real paths are under /api/users/me/*). All fixed: the spec now covers
  exactly the 41 routes, and the shapes EP 20 changed (search, tags, collections)
  were corrected to the single pagination envelope. Wired into check:all, so CI
  enforces it from now on.

Suite: 87 tests. Five gates green.

================================================================================
EP 22 - IMPLEMENTATION AUDIT: FIVE DRIFTS IN MY OWN WORK
================================================================================

Asked to confirm the *implementations* had not drifted either - not just the docs.
Audited code-against-contract instead of re-running the gates. Five real findings:

 1. SECURITY - the anonymous profile graph leaked private resources.
    `GET /api/users/[username]/graph` has no auth guard and called
    `getUserKnowledgeGraph`, which filtered the author's resources by status only -
    so PRIVATE-but-published resources appeared as public graph nodes.
    `assembleGraph` gained a `publicOnly` mode (PUBLIC enforced for both the
    author's nodes and the external targets); the self graph is unchanged.
    +2 regression tests.

 2. Dead config: `/profile` sat in PROTECTED_PREFIXES with no page and no nav link
    anywhere. Removed - Phase F re-adds it with the real page.

 3. A lying type: `RelatedResource.status` was declared in use-resource.ts, but
    findById's relation summary select returns only id/title/slug/type. The field
    was always undefined, and nothing read it. Removed.

 4. Dead hook: `useUpdateCollection` was exported and never used - collections were
    create/read/delete only, despite the plan saying CRUD. Wired an Edit dialog
    (title / description / visibility) onto the collection detail page.

 5. Silent truncation: the collections and tags pages ignored `total`, so anything
    past the first page vanished with no pager. Both now page properly.

Verified clean (not drift): the resources list envelope, the graph page's
node/edge contract, each hook's response type against its route, and the
collection slug rules.

Suite: 89 tests. Five gates green.

================================================================================
EP 23 - DEAD CODE vs UNWIRED CAPABILITY (QUESTIONED, AND CORRECTED)
================================================================================

A dead-export sweep flagged 85 symbols. The honest answer was more nuanced than
"dead": there are two causes, and treating them as one was my mistake.

A. OBSOLETE / SUPERSEDED - deletion was right
   - `list-versions.flow.ts` - the route goes through `ResourceService.listVersions`
     (now viewer-aware); the flow re-implemented it with the weaker `assertExists`.
   - `add/remove-resource-from-collection.flow.ts` - the routes call the service.
     Their logic was actually BETTER (upsert = idempotent), so the real fix went into
     `CollectionService.addResource`, which previously 500'd on a re-add by hitting
     the (collectionId, resourceId) unique key.
   - `src/lib/utils.ts` (`cn`) - with no consumer it is three lines of nothing.
   - Unused DTO surface (`PublishResourceDto`, `ConnectResourcesInput`, the
     `create/updateResourceSchema` aliases) and the unused `presentUserList`.

B. UNWIRED CAPABILITY - deletion was WRONG, restored
   - `update-comment-status.flow.ts`: comment moderation existed with its own
     author-or-admin check but NO route exposed it. Restored AND wired:
     `PATCH /api/comments/[commentId]` (+3 tests).
   - `presentPrivateUser`: `/api/auth/me` hand-built its own projection, which
     omitted `bio` and `archetype` - fields both the `PrivateUser` contract and the
     client's `MeUser` hook declare. `authService.getProfile` now returns
     `presentPrivateUser`, so the three shapes agree.
   - `lib/sg/browser-client.ts`: unused until the facet-auth `SgProvider` slice
     (Model A), which the plan explicitly defers.

Found while verifying: the spec claimed `PUT`/`DELETE` on `/api/comments/{id}`, plus
`GET /api/resources/{id}/relations` and `POST /api/comments/{id}/replies` - none of
which existed. The openapi gate now checks METHODS as well as paths (that is how
these surfaced); on its first run it found 6 more method mismatches, all now fixed,
along with the resources-list and children response shapes.

Routes: unchanged at 41 files - the new comment moderation is an added METHOD
(PATCH /api/comments/[commentId]) on an existing route, not a new file. Suite:
89 -> 92.

================================================================================
EP 24 - CAPACITY AUDIT: WHAT THE SYSTEM CAN DO vs WHAT IS REACHABLE
================================================================================

Asked to check the full capacities of every domain for anything missing,
misimplemented, or erroneous. Audited with evidence rather than by eye: a script
compares the 41 routes, the 15 Prisma models, and every public service method, then
checks which routes any UI code actually calls.

Headline: the backend is far ahead of the product. 18 of 41 routes have no UI
consumer, and two whole services have no route at all.

Biggest gap - ENGAGEMENTS IS UNROUTED:
  ReactionService and FollowService (addReaction, removeReaction, listByResource,
  follow, unfollow, isFollowing, listFollowers, listFollowing) plus their four flows
  have no routes. Reactions and follows are modelled, implemented, and unreachable.
  This is the "Engagements (4 flows, unrouted)" line the roadmap has carried.

Missing CRUD that should probably exist:
  - Tags are append-only: POST/GET only. No update, rename, merge, or delete, so
    the taxonomy accumulates junk with no way to clean it.
  - Version snapshots exist but there is NO rollback/restore to a version.
  - Archive is one-way (no unarchive).

Exposed but unwired (capability exists, nothing calls it):
  - Usage telemetry: POST /resources/{id}/usage has no client, so view metrics only
    ever move via save/unsave.
  - Version history, comments (incl. the now-live moderation), saved/bookmarks,
    bulk actions, and collection reorder all have live endpoints and no UI.
  - Public profile surfaces (/users/{username}/{analytics,saved,graph} and the user
    directory) exist only as API.

Recorded in .agent/todo.txt under OPEN CAPABILITY GAPS so none of it is lost.
Not drift: /api/search/{resources,collections,users,tags} are simply superseded by
the unified /api/search for the console's purposes.

Verified: five gates green (check:openapi now also checks methods), 92 tests.

================================================================================
EP 25 - ENGAGEMENTS ROUTED (reactions + follows)
================================================================================

The audit's headline gap: ReactionService and FollowService (7 methods, 4 flows) were
fully implemented and had no routes at all. Both are now reachable:

  GET    /api/resources/[resourceId]/reactions   list (visible resources only, 404)
  POST   /api/resources/[resourceId]/reactions   add the caller's LIKE (idempotent)
  DELETE /api/resources/[resourceId]/reactions   remove it
  GET    /api/users/[username]/follow            is the caller following?
  POST   /api/users/[username]/follow            follow (400 on self-follow)
  DELETE /api/users/[username]/follow            unfollow (404 when not following)
  GET    /api/users/[username]/followers         paginated, PublicUser shape
  GET    /api/users/[username]/following         paginated, PublicUser shape

Two real defects found and fixed while wiring:
  1. addReactionFlow never asserted visibility, so a caller could react to a private
     resource by id. It now goes through ResourceService.assertVisible (404, not 403),
     matching add-comment and save.
  2. Reactions never touched ResourceMetrics.likes, and metrics had no way to go down.
     ResourceRepository.adjustMetric(resourceId, field, +1/-1) now backs both, clamps at
     zero so it can never corrupt totals, and recomputes the engagement score; the flow
     moves the counter only when the reaction is genuinely new (addReaction reports
     `created`).

Also brought in line with the documented conventions: both engagement services now take
`(db: DbClient = prisma)` like every other service, and follower/following/reaction lists
return the standard paginated envelope.

Routes: 41 -> 45 files. Suite: 92 -> 98 (+6 engagement tests). Spec, roadmap, todo, and
all count literals re-synced in the same change; five gates green.

================================================================================
EP 26 - TAG MANAGEMENT (rename, delete, merge)
================================================================================

The audit's other missing CRUD: tags could be created and listed but never corrected,
so the taxonomy could only accumulate. Now:

  PATCH  /api/tags/[tagId]        rename (slug re-derived; 409 on a name/slug clash)
  DELETE /api/tags/[tagId]        remove (ResourceTag links cascade at the DB level)
  POST   /api/tags/[tagId]/merge  move this tag's resources onto another, then delete it

Merge skips pairs the target already links, so the (resourceId, tagId) primary key is
never violated and no resource ends up double-tagged. Rename and create share one
`slugify` helper, so a tag's name and slug can never disagree.

Conventions held: tags stay service-only (no flows) - they are reference data, as the
existing /api/tags handlers already documented - and the new handlers use the same
module-scope singleton + `safeParse` + ApiError shape.

Routes: 45 -> 47 files. Suite: 98 -> 105 (+7 tag tests).

================================================================================
EP 27 - FULL AUDIT + DRIFT/CONSISTENCY FIXES (2026-11-13)
================================================================================

What happened:
  A full-repo audit (git state, docs, routes/domains, frontend, validations) was
  run against the uncommitted facet dependency bump, then `facet up` + `pnpm i`
  landed: facet-sdk 3.0.0 -> 4.0.1, facet-auth 2.1.1 -> 2.1.2, facet-store
  1.0.5 -> 1.0.6 (installed, lockfile synced).

What changed (safe fixes, no feature work):
  - Route/pattern cleanup: stale comment in api/tags/route.ts; comment routes now
    throw ApiError.notFound (no manual 404 JSON); resources list route dropped a
    redundant prisma arg; /api/search/tags now resolves through TagService.searchTags
    (TagService/TagRepository gained search) instead of inline prisma.
  - UI copy: dashboard removed stale "lands in Phase D/E" hints; settings/ComingSoon
    copy made phase-agnostic (Phase G still planned).
  - proxy.ts header comment corrected (no longer claims to be a deleted placeholder).
  - Docs/trackers re-synced: CLAUDE.md (current gates/state, lint/test/check:all,
    three-anchor auth + SovGrant JWKS blocker, @/core/tenancy, date), architecture.md
    (10 route modules incl graph; tags rename/delete/merge; engagements routed;
    core/tenancy; flow counts 13/2 resources/collections; import table), roadmap +
    todo (status/date, Phase 6 A-E marked done, /search in protected prefixes),
    capacity-and-fragmentation.md (proxy.ts ref).
  - Dependency hygiene: removed unused deps (next-themes, framer-motion, radix-ui,
    canvas-confetti, react-day-picker); lockfile/workspace updated via facet up + pnpm i.

Validations (post-install): pnpm check:all pass (docs, legacy, env, boundaries,
openapi, lint, typecheck); pnpm test 105/105 (19 files); pnpm build succeeded
(36 static pages, 47 routes, proxy). Note: next/font/google requires network.

Left intentionally (needs care / separate work):
  - api/webhooks/sg/route.ts is still the only route not wrapped in handleApiRoute
    and contains inline Prisma logic (raw-body HMAC + idempotency). Refactor only with
    a wrapper that preserves raw-body access and webhook semantics.
  - Phase F (comments/saved/profiles/reactions+follows UI) and Phase G (api-docs
    re-skin, a11y/states polish) remain open; capability gaps (versions rollback,
    unarchive, bulk/reorder UI, usage telemetry, public profile pages) unchanged.
  - facet-sdk 4.0.1 bump: validated green (no Relnex-side SDK API changes required);
    nothing to report to ../facet as needed updates.

State: committed as d5d299d (deps/prune) and 64b1779 (audit fixes + doc/agent sync).

================================================================================
EP 28 - SAFE CAPABILITY UPGRADES WHILE AWAITING SG (2026-11-13)
================================================================================

Goal:
  Close low-risk capability gaps and harden contracts without drifting from the
  canonical goal (connected knowledge/resources) while SovGrant-side JWKS work lands.

What changed:
  - Unarchive (was one-way): `ResourceService.unarchiveResource` (owner-only,
    ARCHIVED -> DRAFT so it can be reviewed before republishing), exposed as
    `DELETE /api/resources/[resourceId]/archive` alongside the existing POST archive.
  - UI: resource detail page now shows Archive/Unarchive for owners (publish/edit
    owner-gated too), and reflects ARCHIVED state; hooks `useArchiveResource` /
    `useUnarchiveResource` added.
  - Usage telemetry wired: resource detail posts `POST /api/resources/[id]/usage`
    (event VIEW) fire-and-forget on load (202 Accepted semantics) so view counts can
    move via the telemetry path, not only save/unsave.
  - track-usage flow fixed to allow anonymous actors (`actorId: ctx.userId ?? null`,
    metadata passthrough) matching the unauthenticated-friendly usage route.
  - OpenAPI updated: archive now documents POST+DELETE (200) and usage documents 202.
  - Docs/trackers noted: unarchive path in architecture; todo records addressed gaps,
    JWKS-verification steps (SG reports resolved 2026-11-11 with access-token RSA key +
    `kid` published at jwks_uri - verify here, set SG_JWKS_URL, validate live
    login->cookie->/api/auth/me), and a safe/future-proof webhook boundary pattern.

Not changed (intentional):
  - Webhook (api/webhooks/sg) left as-is; requires a dedicated raw-body/HMAC wrapper
    or formal exception - not forced into handleApiRoute.
  - Version rollback/restore, comments/saved/profiles/bulk/reorder UI, and other
    Phase F/G work remain open.

Lesson:
  Prefer additive, owner-checked state transitions and fire-and-forget telemetry that
  cannot break reads; document the contract (OpenAPI) in the same change. Auth anchor
  activation (JWKS) is config+verification once SG publishes the right key.

================================================================================
EP 29 - PHASE F SLICES 1-2: ENGAGEMENT + MANAGEMENT UI (2026-11-14)
================================================================================

What happened:
  Phase F was advanced in two validated slices, wiring existing API contracts
  (no route/schema/OpenAPI changes) into the facet-based console UI.

Slice 1 (comments, saved, reactions):
  - Resource detail (`/resources/[id]`) gained Like (toggle) and Save actions for
    onboarded viewers, likes/saves counts, and a discussion surface (root comment,
    replies, lazy reply loading, owner/author moderation status updates).
  - Added `/resources/saved` console page and a "Saved" Workspace nav entry.
  - Hooks/components: `use-reactions`, `use-saved`, `use-comments`,
    `resource-comments.tsx`; mutations invalidate relevant resource/query caches.
  - `pnpm-workspace.yaml` unrecognized `permissions`/`skills` blocks removed so
    pnpm 12.6.0 (pinned via `packageManager`) could run scripts/gates again.
  - Commits: e27c443 (feat), f64ccb8/b98ae9d (lint/type fixes).

Slice 2 (management UX):
  - Resources list: selection, "select page", bulk archive/delete with confirm and
    feedback via `POST /api/resources/bulk`.
  - Collection detail: item reorder (move up/down) with dirty/reset/save posting
    ordered IDs to `POST /api/collections/{id}/reorder`.
  - Tags page: rename, delete, and merge actions via `PATCH/DELETE /api/tags/{id}`
    and `POST /api/tags/{id}/merge`.
  - Hooks: `use-resources`, `use-collections`, `use-tags` extended for mutations.
  - Commit: 87ecc9d.

Dependency follow-up:
  - `@fusorb/facet-store` bumped ^1.0.6 -> ^1.1.0 (manifest/lock synced) and
    `@fusorb/facet-store` added to `minimumReleaseAgeExclude` in
    `pnpm-workspace.yaml` (commits eba500b, 87ecc9d context).

Validations:
  - `pnpm check:all` (docs/legacy/env/boundaries/openapi, lint, typecheck) green
    during the work; follow-up lint/type fixes committed before final green state.

State:
  Repo green; Phase F Slices 1-2 done. Remaining: Phase F Slice 3 (public profile
  pages wiring `/api/users/[username]/*` with visibility semantics) and Phase G
  polish. Env-dependent JWKS activation/e2e and deferred items (version
  restore/rollback, broader usage telemetry UI, webhook refactor) unchanged.
