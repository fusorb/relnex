# Relnex Architecture

> Version 0.1.0 — Next.js 15 App Router + Prisma/PostgreSQL + TailwindCSS v4
> Auth delegated to **SovGrant** (identity microservice, code prefix `sg`)

---

## Directory Map

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, Register pages
│   ├── (public)/           # Marketing landing page
│   ├── (protected)/        # Dashboard (auth-required)
│   ├── (onboarding)/       # Onboarding wizard
│   ├── api-docs/           # Swagger UI documentation
│   └── api/                # 39 API route files across 9 domains
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
│   ├── db/                 # Prisma client singleton + helpers
│   └── flows/              # Flow system (executor, context, errors)
│
├── domains/                # Business logic (per domain)
│   ├── auth/               # Auth service + DTOs (register, login flows)
│   ├── users/              # User service + repository + flows
│   ├── resources/          # 14 flows (CRUD, relations, comments, versions, usage)
│   ├── collections/        # 4 flows (CRUD, resource management)
│   ├── comments/           # Repository + service
│   ├── tags/               # Repository + service
│   ├── search/             # Search service + repository
│   ├── uploads/            # S3 presigned upload service
│   └── activity/           # Activity type constants + fire-and-forget logger
│
├── lib/                    # Third-party clients & utilities
│   ├── sg/                 # SovGrant HTTP SDK client (only client.ts + barrel)
│   ├── errors/             # ApiError, handleError, handleApiRoute
│   ├── storage/            # S3/R2 client
│   └── useful/             # api-client, openapi spec, logger, metadata
│
├── components/             # UI components
│   ├── shared/             # Navbar, Sidebar, Footer
│   ├── layout/             # DashboardLayout, MarketingLayout
│   └── home/               # Hero, Features
│
├── context/                # React providers (Auth, QueryClient, Theme)
├── hooks/                  # useAuth, useApiQuery, useDebounce, useTheme, useMobile
├── config/                 # Site configuration (navigation, features)
└── middleware.ts           # Edge middleware (tenant forwarding)
```

---

## Auth Flow

```
1. REGISTER
   Browser → POST /api/auth/register
     → sg.register(email, password, name)  [HTTP to SovGrant]
     → SovGrant creates Identity, returns { identity.id }
     → Relnex creates User { identityId: identity.id, username }
     ← 201 { userId, identityId }

2. LOGIN
   Browser → POST /api/auth/login
     → sg.login(email, password)  [HTTP to SovGrant]
     → SovGrant verifies credentials, issues JWT
     → Relnex sets HttpOnly cookies: sg_at, sg_rt, sg_sid
     ← 200 { accessToken, refreshToken, sessionId }

3. AUTHENTICATED REQUEST
   Browser → GET /api/users/me/profile
     → Cookie: sg_at=<JWT>  (or Authorization: Bearer <JWT>)
     → middleware forwards tenant headers
     → route handler: const session = await requireAuth(req)
       → getSession(req) extracts JWT from header/cookie
       → verifySgToken(token) — local jose verify (no network call)
       → prisma.user.findUnique({ where: { identityId: payload.sub } })
     ← 200 { user }

4. LOGOUT
   Browser → POST /api/auth/logout
     → clears HttpOnly cookies
     ← 200

5. WEBHOOK SYNC (identity lifecycle)
   SovGrant → POST /api/webhooks/sg (HMAC-signed)
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
- Always wrap in `handleApiRoute` (catches all error types)
- Use `requireAuth` for routes that need any authentication
- Use `requireOnboarded` for routes that need a fully-provisioned user
- Never import from `@/lib/sg/middleware` (deprecated)
- Never import from `@/domains/auth/require-auth` (removed)

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
const result = await flowExecutor.run(createResourceFlow, input, {
  userId: session.user.id,
  identityId: session.identityId,
  tenantId: session.tenantId,
  db: prisma,
});
```

FlowExecutor automatically:
- Validates input via Zod (`inputSchema.parse`)
- Wraps in Prisma transaction
- Validates output via `outputSchema` (if defined)
- Converts FlowError to ApiError

---

## Error Handling

```typescript
import { ApiError, handleApiRoute } from "@/lib/errors";

// Throw from anywhere — handleApiRoute catches it
throw ApiError.notFound("Resource not found");
throw ApiError.badRequest("Invalid slug format");
throw ApiError.unauthorized("Session expired");
throw ApiError.forbidden("Not the resource owner");
```

Available static factories: `badRequest(400)`, `unauthorized(401)`, `forbidden(403)`, `notFound(404)`, `conflict(409)`, `unprocessable(422)`, `internal(500)`

---

## Import Rules

| Import Path | Exports | Used For |
|---|---|---|
| `@/core/auth` | `requireAuth`, `requireOnboarded`, `getSession`, `verifySgToken`, `setAuthCookies`, `clearAuthCookies` | Auth guards, JWT, cookies |
| `@/core/db` | `prisma`, `resourceWithRelations`, `collectionWithResources`, `commentWithAuthor` | Database access |
| `@/core/flows` | `flowExecutor`, `Flow`, `FlowContext`, `FlowError` | Write operation flows |
| `@/lib/errors` | `ApiError`, `handleError`, `handleApiRoute` | Error handling |
| `@/lib/sg` | `sg`, `SgError` | SovGrant HTTP client (register, login, etc.) |
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
