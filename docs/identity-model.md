# ADR: Identity Model - SovGrant as the Canonical IdP

- **Status:** Accepted (2026-10-31)
- **Applies to:** all relying parties - first-party Fusorb products (Relnex, Scholium, Facet, ...) **and third-party client systems and products** that authenticate users through SovGrant
- **Related:** `docs/architecture.md`, `docs/relnex-roadmap.md`
- **Mirror:** the same decision is recorded in SovGrant (`sovgrant/docs/identity-model.md`)

---

## Context

Multiple Fusorb products need user accounts - and so do **third-party client systems
and products** that we do not own. If each one owns its own credentials, sessions,
and profile, we get fragmentation: drift between services, several "change my
password" surfaces, and inconsistent session/refresh behavior. A user must be able
to hold an account across Relnex, Scholium, Facet, and external clients while their
**canonical identity stays in one place**.

## Decision

**SovGrant is the single Identity Provider (IdP).** Every consumer - first-party or
third-party - is a **relying party** that references identity by `User.identityId`
and never owns credentials. The integration contract is **OIDC**; the shared-secret
shortcut exists only for Relnex today and is being retired.

### Two classes of relying party

| | **First-party** (Fusorb products) | **Third-party** (external clients) |
|---|---|---|
| Trust | trusted, first-party | untrusted by default; standard OIDC only |
| Integration | OIDC plus shared packages (`@fusorb/facet-auth`, `@fusorb/facet-sdk`) | public OIDC surface only: discovery, `authorize` + PKCE, `token`, `userinfo`, `introspect`, `revoke`, JWKS |
| Auth UI | embed the shared auth UI | redirect to SovGrant's hosted login + consent |
| Identity settings | link to the canonical SovGrant surface | same - never re-hosted |
| Token verification | **JWKS** (retire shared secret) | **JWKS only** (never a shared secret) |
| Data | may keep a local projection keyed by `identityId` | same |

### Three ownership buckets

| Bucket | Owner | Examples | Rule |
|---|---|---|---|
| **Identity** (global, cross-product) | **SovGrant only** | email/primaryEmail, password, MFA, passkeys, sessions/devices, connected OAuth, email verification, account deletion | Relying parties delegate; never re-implement |
| **Product profile / preferences** | **the relying party**, keyed by `identityId` | display name, bio, avatar, per-product preferences, product onboarding state | Relying-party-owned; not a copy of identity attributes |
| **Org / tenant membership + roles** | **SovGrant (canonical)** | tenants, memberships, roles, invites, tenant policy, scopes | Consume; keep only local, non-identity roles |

### Token flow

- **Auth ceremonies** (login, register, MFA, password reset, passkey, OAuth,
  session refresh, logout) -> owned by SovGrant. Relying parties route these to it
  (first-party via embedded UI, third-party via redirect).
- **Steady-state requests** -> the relying party verifies the token **locally via
  JWKS**; no SovGrant round-trip per request. SovGrant issues, relying parties verify.
- Shared-secret verification is temporary and first-party-only (Relnex today via
  `verifySgToken`); the target for everyone is JWKS.
- New relying parties integrate as **OIDC clients** (authorization code + PKCE,
  registered in SovGrant), never bespoke auth calls.

### Local projection + sync

A relying party may keep a **local account/profile row anchored by `identityId`**
(for example Relnex's `User`). This is a projection, not a duplicate: it must not
mirror identity attributes. Where an identity attribute is cached (email, display
name), it is kept in sync **one-way via SovGrant webhooks**.

## Consequences / Rules

1. Identity-level account management MUST route through SovGrant.
2. Product-specific account management lives in the relying party, keyed by `identityId`.
3. First-party products MUST share the auth UI (`@fusorb/facet-auth`) so login does not diverge.
4. There is ONE canonical identity-settings surface (the SovGrant console); relying
   parties link to it rather than re-hosting password/session/security settings.
5. Third-party clients use the public OIDC contract only and MUST verify via JWKS;
   they are never issued a shared secret and get no privileged/internal access.
6. Do NOT copy identity attributes into product tables. If cached, sync via webhook.
7. Membership/roles and scopes that are meaningful across systems are canonical in
   SovGrant; keep only local, non-identity roles in the relying party.
8. Third-party access is **consent- and scope-gated**: consumers request scopes,
   and the user approves at SovGrant.

## Relnex application

- Bridge: `User.identityId` -> SovGrant `Identity.id` (string ref, no FK).
- Identity lifecycle sync: `POST /api/webhooks/sg` (suspend/delete soft-deletes the local `User`).
- Auth model: **hybrid** - shared `facet-auth` UI over Relnex's BFF httpOnly-cookie
  session. Relnex owns a *session*, not an *identity*. Browser talks to Relnex's
  `/api/auth/*`, which proxy to SovGrant.
- Token verification: local; currently `SG_JWT_SECRET`, migrating to JWKS.
- Onboarding: consume SovGrant's onboarding SDK for user-level progress; Relnex keeps
  any product-specific onboarding state.
- Org/tenant membership: canonical in SovGrant; Relnex keeps local, non-identity roles only.

## Open items

- Decide org/tenant membership ownership fully (SovGrant-canonical vs partly per-relying-party).
- Client registration for third parties: admin-managed vs dynamic client registration.
- Define the scope registry + consent screen copy, and per-client branding at SovGrant.
- Register Relnex (and each relying party) as an OIDC client; move `verifySgToken` to JWKS.
