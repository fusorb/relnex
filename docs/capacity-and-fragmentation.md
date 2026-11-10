# ADR: Capacity & Fragmentation Stress-Test

- **Status:** Accepted (2026-11-10)
- **Applies to:** Relnex (`rx`) as a relying party of SovGrant
- **Related:** `docs/identity-model.md`, `docs/architecture.md`, `docs/environment.md`,
  `docs/relnex-roadmap.md`

---

## Why this exists

`docs/identity-model.md` claims that making SovGrant the single IdP **resolves
fragmentation**: one account across every Fusorb product and third-party client, one
place for password/MFA/session, and a local projection keyed by `identityId` rather than
duplicated credentials.

That claim is easy to make and hard to keep. This ADR asks the uncomfortable version:
**if Relnex is fully utilized five years from now, is the fragmentation claim still true -
and what breaks first if users start sending negative feedback?** Each failure mode below
is paired with the day-1 rule that keeps it from becoming a migration later.

Nothing here changes the architecture. It constrains the code we write inside it.

---

## The claim, restated

- **Identity** (email, password, MFA, passkeys, sessions, connected OAuth, deletion) is
  owned by SovGrant only.
- **Relnex keeps a projection row** (`User`) anchored by `User.identityId`; it stores no
  credentials and must not mirror identity attributes except where cached one-way via webhook.
- **Product profile/preferences** and **content** (resources, collections, comments, tags,
  engagements) are Relnex-owned.
- Steady-state requests verify a token **locally** (shared secret today, JWKS next).

The claim survives at scale only if the projection stays *thin*, sync stays *reliable*, and
authorization stays *correct*. Those are the three stress axes.

---

## Failure modes (and the day-1 rule for each)

### 1. Identity projection drift
Caching identity attributes (email, display name) is where "projection" quietly becomes
"duplicate". A cached email that lags a SovGrant-side change is a support ticket; a stale
one after account deletion is a compliance problem.

- **Day-1 rule:** cache identity attributes *only* when a product feature needs them, mark
  them as a projection, and never treat them as authoritative. Relnex already keeps
  `displayName`/`avatarUrl` as product-owned profile fields - do not clone email/password
  into `User`.

### 2. Webhook reliability (idempotency, replay, ordering)
`POST /api/webhooks/sg` is the only sync channel. A dropped or replayed event silently
diverges the local `User` from canonical identity.

- **Applied now:** the handler is **idempotent** - the event id (or a body hash) is claimed
  in a `WebhookEvent` ledger with `skipDuplicates`, so a replay is a no-op. Signature is
  HMAC-verified before processing.
- **Day-1 rule:** every inbound webhook is signature-verified and idempotent. Do not
  process an event whose effect depends on order unless it carries an ordering key.
- **Follow-up:** the missing-event case (SovGrant delivered, Relnex was down) still needs a
  reconciliation sweep - tracked below.

### 3. Shared secret -> JWKS
Local verification with a shared secret means (a) revocation is only as fast as token
expiry, (b) rotation is a coordinated two-repo change, and (c) third-party relying parties
must *never* get the secret - they must use JWKS.

- **Day-1 rule:** keep `verifySgToken` as the single seam; the JWKS swap must not touch any
  caller. Eventually a Relnex-issued session cookie should be the only long-lived artifact,
  with SovGrant tokens short-lived.

### 4. Tenant / default-scope collisions
`tenantId` defaults to the reserved `relnex-default`, and `resolveTenantId()` maps an absent
`tid` claim to it. That is safe *only* while no real tenant id equals the default.

- **Day-1 rule:** `relnex-default` is reserved forever (collision check enforced at
  tenant creation in SovGrant). Tenant isolation must never rely on a client-supplied
  tenant header alone - it comes from the verified JWT `tid` (see `src/middleware.ts`).
- **Follow-up:** consider Postgres RLS as a second layer for tenant-scoped tables.

### 5. Scale: reads, search, pagination, soft-delete
Read paths degrade before writes do. Relnex lists (comments, resources, saved) can develop
N+1s, and search currently has **no full-text/trigram index**.

- **Day-1 rule:** every list endpoint takes bounded pagination (`defaultPageSize`/`maxPageSize`)
  and every soft-deletable table filters `deletedAt: null` in *one* place (repository), not
  per-call.
- **Follow-up:** add a `pg_trgm`/TSVECTOR index on `Resource.title`/`excerpt`/content for the
  search domain; add covering indexes as query patterns solidify. Hot foreign keys already
  carry indexes in `schema.prisma`.

### 6. Denormalized counters (`ResourceMetrics`)
`views/likes/bookmarks/comments` are denormalized counters that will drift from the
underlying rows under concurrency.

- **Day-1 rule:** the row table is the source of truth; metrics are a cache. Any metric must
  be reconstructible by a query, and reconciled on a schedule - never the other way around.

### 7. Authorization gaps
Public-profile routes can expose private/draft content, and roles/`withScope` are not
enforced. This is the most likely source of *negative* feedback.

- **Day-1 rule:** default deny on visibility - a public read returns only rows whose
  `visibility`/`status` allow it, and ownership checks are mandatory on writes. Never ship a
  route that returns raw models without a presenter.

### 8. Negative-feedback playbook
What a user experiences when something breaks, and how it maps to a rule:

| Symptom | Root cause | Day-1 rule |
|---|---|---|
| "Login fails, no reason" | client masked every error as 500 | **Applied now:** `api-client` maps status to the right `ApiError` |
| "Someone brute-forced my login" | no rate limit on `/api/auth/login` | add rate limiting (Upstash/Redis) - follow-up |
| "It replied oddly to a cross-site request" | no CSRF / no security headers | **Applied now:** baseline headers; CSRF plan - follow-up |
| "My comments/private items leaked" | visibility not enforced | default-deny + presenters (rule 7) |
| "My name/email is wrong" | projection drift | thin projection + webhook sync (rules 1-2) |

---

## Applied in this pass (cheap, safe)

1. `src/lib/useful/api-client.ts` maps HTTP status to `ApiError` (was always 500).
2. `next.config.ts` sends baseline security headers (nosniff, frame-deny, referrer policy,
   HSTS, permissions policy).
3. Webhook idempotency: new `WebhookEvent` ledger + `skipDuplicates` claim in
   `src/app/api/webhooks/sg/route.ts`.

## Future work (documented, not built)

- JWKS verification behind `verifySgToken`.
- Webhook reconciliation sweep for missed events.
- `pg_trgm`/TSVECTOR search index.
- Rate limiting on auth routes; CSRF verification; a nonce-based CSP.
- Metrics reconciliation job.
- Postgres RLS as a tenant-isolation second layer.
- Vitest suite covering core auth, the flow executor, and error mapping.

---

## Decision

The fragmentation-resolution claim **holds at five years only if the projection stays thin,
sync stays idempotent, and authorization defaults to deny.** Those three properties are now
either enforced by code (idempotent webhook, status-accurate client errors, security headers)
or pinned as day-1 rules above. The remaining items are scheduled, not assumed.
