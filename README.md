# Relnex

Next.js 16 knowledge-graph application. Auth is delegated to [SovGrant](https://github.com/fusorb/sovgrant)
(a Fastify identity service, code prefix `sg`).

> **Status: paused (2026-10-31).** Backend is stabilized and the app builds clean; the
> frontend page build-out (Phase 6) is deferred until SovGrant is stable. See
> [docs/relnex-roadmap.md](./docs/relnex-roadmap.md) for the live plan.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Package manager**: pnpm
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: SovGrant (external identity service)
- **Storage**: S3-compatible (AWS S3 / Cloudflare R2)
- **UI**: `@fusorb/facet-components` + Tailwind CSS v4

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

See [docs/architecture.md](./docs/architecture.md) and
[docs/relnex-roadmap.md](./docs/relnex-roadmap.md). The AI handbook lives in
[CLAUDE.md](./CLAUDE.md) and [AGENTS.md](./AGENTS.md).

### Route Handler Pattern

API routes follow a consistent pattern:

```typescript
import { handleApiRoute } from "@/lib/errors";
import { requireAuth } from "@/core/auth";
import { NextRequest, NextResponse } from "next/server";

export const GET = handleApiRoute(async (req, { params }) => {
  const session = await requireAuth(req);
  return NextResponse.json({ success: true, data: result });
});
```

`handleApiRoute` awaits Next 16's async `params` and centralizes error handling, so
handlers keep synchronous `params` access.

### Domain Structure

Business logic lives in `src/domains/` following a flows/services/repositories pattern:

```
domains/{name}/
  {name}.dto.ts          - Zod schemas + types
  {name}.service.ts      - Business logic / orchestration
  {name}.repository.ts   - Database access
  flows/
    {action}.flow.ts     - Composable action flows
```

### Import Rules

| Import | Must be from | Never from |
|--------|-------------|------------|
| Auth guards | `@/core/auth` | `@/domains/auth/` |
| Error handling | `@/lib/errors` | individual files (except the client leaf `@/lib/errors/api-error`) |
| Prisma | `@/core/db` | `@/lib/useful/db-client` |
| Flows | `@/core/flows` | individual flow files |
| Sg SDK | `@/lib/sg` | individual client files |

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm format` | Prettier formatting |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate` | Run database migrations |

> **Note:** `pnpm lint` currently points at `next lint`, which Next.js 16 removed.
> Moving lint to the ESLint CLI is tracked in Phase 7. Use `pnpm typecheck` as the
> current green gate.
