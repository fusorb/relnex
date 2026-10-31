# ADR: Identity Model - SovGrant as the Canonical IdP

- **Status:** Accepted (2026-10-31)
- **Applies to:** Relnex, Scholium, Facet, and all Fusorb products
- **Related:** `docs/architecture.md`, `docs/relnex-roadmap.md`

---

## Context

Multiple Fusorb products need user accounts. If each product owns its own
credentials, sessions, and profile, we get fragmentation: drift between services,
several "change my password" surfaces, and inconsistent session/refresh behavior.
Users should be able to hold an account across Relnex, Scholium, Facet, etc. while
their **canonical identity stays in one place**.

## Decision

**SovGrant is the single Identity Provider (IdP).** Every product is a **relying
party** that references identity by `User.identityId` and never owns credentials.
The integration model is **OIDC** (though the shared-secret shortcut exists today
and is being retired).

### Three ownership buckets

| Bucket | Owner | Examples | Rule |
|---|---|---|---|
| **Identity** (global, cross-product) | **SovGrant only** | email/primaryEmail, password, MFA, passkeys, sessions/devices, connected OAuth, email verification, account deletion | Products delegate; never re-implement |
| **Product profile / preferences** | **the product**, keyed by `identityId` | product display name, bio, avatar, per-product preferences, product onboarding state | Product-owned; not a copy of identity attributes |
| **Org / tenant membership + roles** | **SovGrant (canonical)** | tenants, memberships, roles, invites, tenant policy | Products consume; keep only product-local, non-identity roles |

### Token flow

- **Auth ceremonies** (login, register, MFA, password reset, passkey, OAuth,
  session refresh, logout) -> owned by SovGrant. Products route these to it.
- **Steady-state requests** -> the product verifies the token **locally via JWKS**;
  no SovGrant round-trip per request. SovGrant issues, products verify.
- Shared-secret verification is a temporary shortcut (Relnex uses it today via
  `verifySgToken`); the target is JWKS.
- New products integrate as **OIDC clients** (authorization code + PKCE, register
  the product in SovGrant), not bespoke auth calls.

### Local projection + sync

A product may keep a **local account/profile row anchored by `identityId`** (for
example Relnex's `User`). This is a project, not a duplicate: it must not mirror
identity attributes. Where an identity attribute is cached (email, display name),
it is kept in sync **one-way via SovGrant webhooks**.

## Consequences / Rules

1. Identity-level account management MUST route through SovGrant.
2. Product-specific account management lives in the product, keyed by `identityId`.
3. Products MUST share the auth UI (`@fusorb/facet-auth`) so login does not diverge.
4. There is ONE canonical identity-settings surface (the SovGrant console);
   products link to it rather than re-hosting password/session/security settings.
5. Do NOT copy identity attributes into product tables. If cached, sync via webhook.
6. Membership/roles that are meaningful across products are canonical in SovGrant;
   keep only product-local, non-identity roles in the product.

## Relnex application

- Bridge: `User.identityId` -> SovGrant `Identity.id` (string ref, no FK).
- Identity lifecycle sync: `POST /api/webhooks/sg` (suspend/delete soft-deletes the local `User`).
- Auth model: **hybrid** - shared `facet-auth` UI over Relnex's BFF httpOnly-cookie
  session. Relnex owns a *session*, not an *identity*. Browser talks to Relnex's
  `/api/auth/*`, which proxy to SovGrant.
- Token verification: local; currently `SG_JWT_SECRET`, migrating to JWKS.
- Onboarding: consume SovGrant's onboarding SDK for user-level progress; Relnex keeps
  any product-specific onboarding state.
- Org/tenant membership: canonical in SovGrant; Relnex keeps product-local, non-identity roles only.

## Open items

- Confirm whether org/tenant membership is fully canonical in SovGrant or partly per-product.
- Register Relnex (and each product) as an OIDC client; move `verifySgToken` to JWKS.
