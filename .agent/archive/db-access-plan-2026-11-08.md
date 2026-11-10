> **ARCHIVED (2026-11-08).** Historical plan. Its env/`sg`-contract findings have been
> resolved; the per-repo DB role migration (`relnex_app`) remains deferred. Current
> contract: [../../docs/environment.md](../../docs/environment.md).

# Relnex — Database Access & Secret Hygiene Plan

**Status:** proposed · 2026-11-08
**Scope:** local/dev PostgreSQL access, plus secret and naming drift found while
reconciling the ecosystem databases.

---

## Why

Every repo in the Fusorb workspace authenticates to the same local PostgreSQL
instance (`127.0.0.1:5432`) as the same role, `arcevodev`:

| repo | database | role |
| --- | --- | --- |
| sovgrant | `sg` | `arcevodev` |
| relnex | `relnex` | `arcevodev` |
| eduwise | `eduwise` | `arcevodev` |

That role's password was committed to a **public** repository and has since been
rotated (sovgrant EP 13), but the *sharing* is the remaining problem:

- one credential unlocks every local database
- any repo can read or write another repo's data
- a leak in one repo is a leak in all three
- nothing constrains an app to the privileges it actually needs

## Target state

One role per repo, owning only its own database, with no superuser rights:

| repo | role | database |
| --- | --- | --- |
| sovgrant | `sg_app` | `sg` |
| relnex | `relnex_app` | `relnex` |
| eduwise | `eduwise_app` | `eduwise` |

Each password is generated per repo (`openssl rand -hex 32`) and stored only in that
repo's **untracked** `.env`.

---

## Steps (per repo)

### 1. Create the role and give it its database

Run once as a superuser (e.g. `postgres`):

```sql
CREATE ROLE relnex_app LOGIN PASSWORD '<generated>';
ALTER DATABASE relnex OWNER TO relnex_app;
GRANT ALL PRIVILEGES ON DATABASE relnex TO relnex_app;
```

Then, **connected to the `relnex` database**, transfer ownership of existing objects
rather than granting broadly:

```sql
REASSIGN OWNED BY arcevodev TO relnex_app;
```

If any objects remain owned by the old role, grant explicitly:

```sql
GRANT ALL ON SCHEMA public TO relnex_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO relnex_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO relnex_app;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO relnex_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO relnex_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO relnex_app;
```

### 2. Point the repo at its own role

`.env` (untracked):

```
DATABASE_URL=postgresql://relnex_app:<generated>@127.0.0.1:5432/relnex?schema=public
```

`.env.example` keeps a placeholder only (already correct in this repo):

```
DATABASE_URL=postgresql://USER:password@localhost:5432/relnex?schema=public
```

### 3. Verify

```bash
psql "$DATABASE_URL" -c "select current_user, current_database();"
pnpm prisma migrate status       # must report up to date
```

The new role must **not** be able to reach `sg` or `eduwise`.

### 4. Retire the shared role

Only once all three repos are migrated should `arcevodev` lose its rights. Deferred
until then.

---

## Related findings in this repo

Found during the same scan; not part of the DB-user change, but worth handling with it.

1. **Live secrets were printed into an agent transcript.** While reading `.env` for
   this plan, the Cloudflare R2 access key + secret and `ARCID_JWT_SECRET` were echoed
   into the session output. Treat both as exposed: rotate the R2 key pair, regenerate
   the JWT secret, and update every consumer.

2. **`.env` still uses the pre-rename `ARCID_*` variables** while `.env.example`
   already uses the new `SG_*` contract:

   | `.env` (current) | `.env.example` (target) |
   | --- | --- |
   | `ARCID_API_URL` | `SG_API_URL` |
   | `ARCID_CLIENT_ID="arcbase"` | `SG_CLIENT_ID=relnex` |
   | `ARCID_ISSUER="arcid"` | (issuer should be `sovgrant`) |
   | `ARCID_JWT_SECRET` | `SG_JWT_SECRET` |

   This is a live integration risk, not just cosmetic: if SovGrant issues tokens with
   `iss: sovgrant` while relnex validates `ARCID_ISSUER="arcid"`, token validation
   will fail. Align `.env` on the `SG_*` contract.

3. **Storage naming still says `arcbase`** — `STORAGE_BUCKET_NAME=arcbase-media-bucket`.
   Rename or document it as intentional legacy (like the `arcevocirqle` brand).

## Not doing here

- Not touching production/hosted credentials (relnex's local dev only).
- Not introducing a secrets manager — that is a separate, larger change.
- Not renaming the live `arcevocirqle` brand, domain, or email addresses.
