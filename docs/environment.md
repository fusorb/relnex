# Relnex - Environment Contract & Secret Hygiene

> Canonical description of every environment variable Relnex reads, who owns each
> secret, and the rules that keep the local/dev setup safe. `.env.example` is the
> template; this file explains it. Both are machine-checked by
> `pnpm check:env` (see `scripts/check-env-sync.mjs`).

---

## Runtime

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | no (framework) | `development` / `production` |
| `NEXT_PUBLIC_APP_URL` | yes | Public base URL (`src/config/site.ts`) |
| `LOG_LEVEL` | no | Pino level, default `debug` |

## Database

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string (`src/core/db/prisma.ts`) |

Relnex owns one database (`relnex`) through one role (`relnex_app`) that owns only
that database - never a shared, cross-repo role. See the DB-role migration note in
`.agent/archive/db-access-plan-2026-11-08.md` (historical) for the exact SQL.

## SovGrant (identity provider - code prefix `sg`)

SovGrant is the canonical IdP. Relnex is a relying party keyed by `User.identityId`.
Identity-level secrets live in SovGrant; Relnex holds only what it needs to verify
tokens and receive webhooks.

| Variable | Required | Purpose |
|---|---|---|
| `SG_API_URL` | yes | SovGrant base URL (`src/lib/sg/client.ts`) |
| `SG_CLIENT_ID` | yes | OAuth/M2M client id registered for Relnex |
| `SG_ISSUER` | yes | Expected `iss` claim; must match SovGrant's `JWT_ISSUER` (`src/core/auth/jwt.ts`) |
| `SG_JWKS_URL` | no | Preferred: SovGrant JWKS (RS256). When set, tokens verify asymmetrically via JWKS and `SG_JWT_SECRET` is ignored (`src/core/auth/jwt.ts`) |
| `SG_JWT_SECRET` | no (dev/e2e) | HS256 shared trust anchor **fallback** when `SG_JWKS_URL` is unset (`src/core/auth/jwt.ts`) |
| `SG_SERVICE_TOKEN` | yes | M2M token for server-to-server calls (`src/lib/sg/client.ts`) |
| `SG_WEBHOOK_SECRET` | yes | HMAC signing secret for `/api/webhooks/sg` |

> Two trust anchors, one seam (`verifySgToken`):
> - **JWKS (RS256)** - the target. Set `SG_JWKS_URL` to SovGrant's published key set.
> - **Shared secret (HS256)** - the temporary first-party shortcut for local dev / e2e.
>   It only works while SovGrant also signs with HS256 (no `PRIVATE_KEY_PEM`).
>
> `SG_JWT_SECRET` must equal SovGrant's `JWT_SECRET`, and `SG_WEBHOOK_SECRET` must
> equal SovGrant's `WEBHOOK_SIGNING_SECRET`. **Current blockers before JWKS works
> end-to-end:** SovGrant's JWKS (`/api/v1/oauth/jwks`) publishes the tenant VC/DID
> signing keys, not the RSA key that signs access tokens, and access tokens carry
> no `kid`. SovGrant must publish the access-token signing key (and/or set a `kid`)
> first - see `docs/identity-model.md`.

## Storage (S3-compatible: Cloudflare R2 / AWS S3 / MinIO)

| Variable | Required | Purpose |
|---|---|---|
| `STORAGE_ACCESS_KEY_ID` | yes | Access key (`src/lib/storage/s3.ts`, `upload.service.ts`) |
| `STORAGE_SECRET_ACCESS_KEY` | yes | Secret key |
| `STORAGE_ENDPOINT` | R2/dev | S3 endpoint; omit for native AWS S3 |
| `STORAGE_BUCKET_NAME` | yes | Bucket, e.g. `relnex-media` |
| `STORAGE_REGION` | yes | `auto` for R2 |
| `NEXT_PUBLIC_STORAGE_PUBLIC_URL` | no | Public CDN base for stored media |

Optional AWS-native fallbacks are read if the `STORAGE_*` names are absent:
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`.

---

## Secret hygiene rules

1. **The real `.env` is never committed.** Only `.env.example` (placeholder values) is
   tracked. `.gitignore` enforces this.
2. **No secret backups in the repo.** Timestamped `.env.bak-*` / `.env.dbname-*` copies
   are forbidden; rotate any secret that was ever written to a committed file.
3. **Identity secrets belong to SovGrant.** Relnex stores no passwords, MFA seeds,
   passkeys, or session tables.
4. **One role per repo.** No shared database role across Fusorb repos.
5. **Rotation.** If a secret is printed to a transcript, log, or commit, treat it as
   exposed: rotate the R2 key pair, regenerate the JWT secret, and update every consumer.
