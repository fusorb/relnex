# Relnex

Next.js 15 knowledge-graph application. Auth delegated to [SovGrant](https://github.com/fusorb/sovgrant) (Fastify identity service, code prefix `sg`).

## Stack

- **Framework**: Next.js 15 (App Router)
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

See [docs/architecture.md](./docs/architecture.md) and [docs/relnex-roadmap.md](./docs/relnex-roadmap.md) for the full architecture and rebuild plan.

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

### Domain Structure

Business logic lives in `src/domains/` following a flows/services/repositories pattern:

```
domains/{name}/
  {name}.dto.ts          — Zod schemas + types
  {name}.service.ts      — Business logic / orchestration
  {name}.repository.ts   — Database access
  flows/
    {action}.flow.ts     — Composable action flows
```

### Import Rules

| Import | Must be from | Never from |
|--------|-------------|------------|
| Auth guards | `@/core/auth` | `@/lib/sg/middleware` |
| Error handling | `@/lib/errors` | individual files |
| Prisma | `@/core/db` | relative paths |
| Flows | `@/core/flows` | individual flow files |
| SG SDK | `@/lib/sg` | individual client files |

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm format` | Prettier formatting |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate` | Run database migrations |
