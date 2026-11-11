# Relnex Architecture

> Version 0.1.0 - Next.js 16 App Router + Prisma/PostgreSQL + TailwindCSS v4
> Auth delegated to **SovGrant** (identity microservice, code prefix `sg`)

---

## Directory Map

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # facet AuthLayout + facet-auth SignIn/forms
│   ├── (public)/           # facet LandingLayout marketing page
│   ├── (protected)/        # facet ConsoleLayout dashboard shell
│   ├── (onboarding)/       # Onboarding wizard (Phase B - SG onboarding SDK)
│   ├── api-docs/           # Swagger UI documentation
│   └── api/                # 40 API route files across 9 route modules
│       ├── auth/           # login, register, logout, me
│       ├── users/          # profile, onboarding, admin
│       ├── resources/      # CRUD, relations, comments, versions, usage
│       ├── collections/    # CRUD, resource management, reorder
│       ├── comments/       # get, update status, replies
│       ├── tags/           # list, create
│       ├── search/         # unified search across entities
│       ├── uploads/        # presigned upload URLs
│       └── webhooks/       # SG identity lifecycle sync
│
├── core/                   # Infrastructure (no business logic)
│   ├── auth/               # JWT verify, guards, cookies, session
│   ├── db/                 # Prisma client singleton (pg adapter)
│   └── flows/              # Flow system (executor, context, errors)
│
├── domains/                # Business logic (9 domains)
│   ├── auth/               # Auth service + DTOs (register, login flows)
│   ├── users/              # User service + repository + 3 flows
│   ├── resources/          # 14 flows (CRUD, relations, comments, versions, usage)
│   ├── collections/        # 4 flows (CRUD, resource management)
│   ├── comments/           # Repository + service
│   ├── engagements/        # Reactions, follows (4 flows; no API surface yet)
│   ├── tags/               # Repository + service
│   ├── search/             # Search service + repository
│   └── uploads/            # S3 presigned upload service
│
├── lib/                    # Third-party clients & utilities
│   ├── sg/                 # SovGrant SDK boundary (SgClient/AuthSdk re-export + unwrap)
│   ├── errors/             # ApiError (leaf), handleError, handleApiRoute
│   ├── storage/            # S3/R2 client
│   └── useful/             # api-client, openapi spec, logger, metadata
│
├── components/             # facet-based UI glue
│   ├── providers.tsx       # ThemeProvider + React Query + Toaster (facet)
│   └── layout/             # router-adapter.tsx (Next RouterAdapter for facet-layout)
│
├── hooks/                  # use-session (facet LayoutSession from /api/auth/me)
├── config/                 # site.ts (constants) + layout.tsx (facet LayoutConfig)
├── styles/                 # globals.css + relnex-palette.css (Relnex brand)
├── test/                   # Vitest setup (env contract for the suite)
└── proxy.ts                # Next 16 proxy (tenant header forwarding + gating)
```

---

## Auth Flow

See [identity-model.md](./identity-model.md) for the canonical-identity decision
(SovGrant is the IdP; Relnex is a relying party keyed by `User.identityId`).

```
1. REGISTER
   Browser → POST /api/auth/register
     → registerFlow → AuthSdk.register(...)  [HTTP to SovGrant via @/lib/sg]
     → SovGrant creates Identity, returns { identity.id }
     → Relnex creates User { identityId: identity.id, username }
     ← 201 { userId }

2. LOGIN
   Browser → POST /api/auth/login
     → loginFlow → AuthSdk.login(email, password)  [HTTP to SovGrant]
     → SovGrant verifies credentials, issues JWT
     → Relnex sets HttpOnly cookies: sg_at, sg_rt, sg_sid
     ← 200 { accessToken, refreshToken, sessionId, expiresIn }

3. AUTHENTICATED REQUEST
   Browser → GET /api/users/me/profile
     → Cookie: sg_at=<JWT>  (or Authorization: Bearer <JWT>)
     → proxy verifies the JWT and forwards x-tenant-id / x-identity-id
     → route handler: const session = await requireAuth(req)
        → getSession(req) extracts JWT from header/cookie
        → verifySgToken(token) - local jose verify (JWKS, pinned key, or shared secret)
        → prisma.user.findUnique({ where: { identityId: payload.sub } })
     ← 200 { user }

4. LOGOUT
   Browser → POST /api/auth/logout
     → clears HttpOnly cookies
     ← 200

5. WEBHOOK SYNC (identity lifecycle)
   SovGrant → POST /api/webhooks/sg
     → IDENTITY_SUSPENDED/DELETED: soft-deletes Relnex User
     → USER_REGISTERED: pre-provisions Relnex User
     ← 200
```

---

## Route Handler Pattern

Every route handler follows this exact pattern:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { prisma } from "@/core/db";

export const GET = handleApiRoute(async (req: NextRequest, { params }) => {
  const session = await requireOnboarded(req);
  const resource = await prisma.resource.findUnique({ ... });
  return NextResponse.json({ success: true, data: resource });
});
```

Key rules:
- Always wrap in `handleApiRoute` (catches all error types, awaits async `params`)
- Use `requireAuth` for routes that need any authentication
- Use `requireOnboarded` for routes that need a fully-provisioned user
- `@/lib/sg/middleware` no longer exists (superseded by `@/core/auth` + `src/proxy.ts`)

---

## Flow Pattern

All multi-step write operations use the Flow system:

```typescript
export const createResourceFlow: Flow<CreateResourceInput, ResourceDTO> = {
  name: "resource:create",
  inputSchema: CreateResourceDto,
  async execute(input, ctx: FlowContext) {
    // ctx.db is a Prisma transaction client
    // ctx.userId, ctx.identityId, ctx.tenantId are available
    return ctx.db.resource.create({ data: { ...input, authorId: ctx.userId } });
  },
};
```

Flows are executed via `FlowExecutor`:

```typescript
const result = await flowExecutor.run(
  createResourceFlow,
  input,
  { userId: session.userId, identityId: session.identityId, tenantId: session.tenantId },
);
```

`FlowExecutor` automatically:
- Validates input via Zod (`inputSchema.parse`)
- Wraps execution in a Prisma transaction (`ctx.db` is the transaction client)
- Validates output via `outputSchema` (if defined)
- Re-throws `FlowError` / `ApiError` / `SgError` unchanged so `handleError` can map them

`FlowContext.db` is always injected by the executor - callers pass only the
`InboundCtx` fields (`userId`, `identityId`, `tenantId`, plus optional `ip`/`userAgent`).

---

## Error Handling

```typescript
import { ApiError, handleApiRoute } from "@/lib/errors";

// Throw from anywhere - handleApiRoute catches it
throw ApiError.notFound("Resource not found");
throw ApiError.badRequest("Invalid slug format");
throw ApiError.unauthorized("Session expired");
throw ApiError.forbidden("Not the resource owner");
```

Available static factories: `badRequest(400)`, `unauthorized(401)`, `forbidden(403)`, `notFound(404)`, `conflict(409)`, `unprocessable(422)`, `internal(500)`

`handleError` maps `ApiError`, `SgError`, `ZodError` (422), and `FlowError` to JSON responses.
Client-side code must import the leaf `@/lib/errors/api-error` (not the barrel), because the
barrel pulls the server-only chain (`@/core/flows` -> Prisma -> `pg`) into the browser bundle.

---

## Import Rules

| Import Path | Exports | Used For |
|---|---|---|
| `@/core/auth` | `requireAuth`, `requireOnboarded`, `getSession`, `verifySgToken`, `setAuthCookies`, `clearAuthCookies` | Auth guards, JWT, cookies |
| `@/core/db` | `prisma` | Database access |
| `@/core/flows` | `flowExecutor`, `Flow`, `FlowContext`, `FlowError` | Write operation flows |
| `@/lib/errors` | `ApiError`, `handleError`, `handleApiRoute` | Error handling (server) |
| `@/lib/errors/api-error` | `ApiError` | Error handling (client leaf) |
| `@/lib/sg` | `SgClient`, `AuthSdk`, `SgError`, `unwrap`, `createServerSgClient` | SovGrant SDK calls |
| `@/lib/storage/s3` | `s3Client` | S3 uploads |
| `@/config/site` | `siteConfig` | Navigation, features, validation |

---

## Service Construction

Services accept `(db: DbClient)` with a default of `prisma` singleton:

```typescript
export class ResourceService {
  constructor(private db: DbClient = prisma) {
    this.repo = new ResourceRepository(db);
  }
}
```

Inside a `Flow`, services receive the transaction-scoped `ctx.db`. Outside a Flow (in simple GET handlers), the default `prisma` singleton is used.

---

## Proxy

`src/proxy.ts` (the Next 16 rename of `middleware.ts`) verifies the SovGrant JWT (from
the `sg_at` cookie or `Authorization` header) and injects `x-tenant-id` (from the `tid`
claim) and `x-identity-id` (from `sub`) into the forwarded request. It also gates protected
page prefixes, redirecting unauthenticated users to `/login`.

> Next.js 16 renamed the `middleware` file convention to `proxy` and defaults it to the
> Node.js runtime. Token verification goes through `verifySgToken`, resolved in order:
> JWKS (`SG_JWKS_URL`), then a pinned public key (`SG_JWT_PUBLIC_KEY`), then the shared
> secret (`SG_JWT_SECRET`). Algorithms are pinned per anchor.

---

## Frontend (facet stack)

The UI is built entirely on `@fusorb/facet-*` - no hand-rolled layouts, providers,
or icon registry (a boundary gate enforces this).

- **Providers** (`src/components/providers.tsx`): facet-components `ThemeProvider`
  (writes `data-theme`) -> React Query -> facet `Toaster`.
- **Router** (`src/components/layout/router-adapter.tsx`): a facet-layout
  `RouterAdapter` backed by `next/link` + `usePathname`; injected into the shells.
- **Shells** (`src/config/layout.tsx`): facet `LayoutConfig` for the console
  (`ConsoleLayout`), auth (`AuthLayout`), and landing (`LandingLayout`).
- **Auth UI**: facet-auth `LoginForm` over Relnex's BFF `/api/auth/*` (httpOnly
  cookie session). The facet-auth `SgProvider` / OIDC-client migration is the next
  slice (see the frontend plan).
- **Session**: `src/hooks/use-session.ts` maps `/api/auth/me` to a facet-layout
  `LayoutSession`.
- **Brand**: `src/styles/relnex-palette.css` overrides the facet semantic tokens
  (the documented "bring your own palette" pattern).

---

## Testing

Vitest covers the core seams (`pnpm test`); it runs in CI before the build.

- `src/core/auth/jwt.test.ts` - real `jose` sign/verify round-trips (signature, issuer, expiry).
- `src/core/auth/jwt.jwks.test.ts` - JWKS/RS256 verification against a local key set.
- `src/core/auth/jwt.pem.test.ts` - pinned-public-key/RS256 verification (inline PEM + path).
- `src/core/auth/get-session.test.ts` - token resolution (header vs cookie) + User projection.
- `src/core/auth/require-auth.test.ts` - guard behavior + first-login auto-provisioning.
- `src/core/flows/flow-executor.test.ts` - input validation, transactions, error normalization.
- `src/lib/useful/api-client.test.ts` - HTTP status to `ApiError` mapping.
- `src/proxy.test.ts` - gating and tenant/identity header forwarding.

Prisma and the token-verification seam are mocked in the unit tests, so the suite needs no
database or live SovGrant.
