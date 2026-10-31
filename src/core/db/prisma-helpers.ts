// core/db/prisma-helpers.ts
// SPLIT: commentWithAuthor and commentWithAuthorAndReplies are now separate.
// The original single definition loaded replies on EVERY comment fetch - including
// root comment lists - which made those queries much heavier than necessary.
// Use commentWithAuthor for lists; commentWithAuthorAndReplies only when you need
// the reply count or shallow preview (e.g. findById for the standalone GET endpoint).
import { Prisma } from "@prisma-client";

const authorSelect = {
  select: { id: true, username: true, displayName: true, avatarUrl: true },
} as const;

// Resource queries
export const resourceWithRelations = Prisma.validator<Prisma.ResourceInclude>()(
  {
    author: authorSelect,
    resourceTags: { include: { tag: true } },
    metrics: true,
    _count: { select: { children: true, comments: true, versions: true } },
  },
);

// Collection queries
export const collectionWithResources =
  Prisma.validator<Prisma.CollectionInclude>()({
    author: authorSelect,
    resources: {
      orderBy: { orderIndex: "asc" as const },
      include: {
        resource: { include: resourceWithRelations },
      },
    },
  });

// Comment - lightweight: author only. Use for list endpoints (root comments, replies).
// Does NOT eagerly load replies - those are fetched by the /replies endpoint on demand.
export const commentWithAuthor = Prisma.validator<Prisma.CommentInclude>()({
  author: authorSelect,
});

// Comment - rich: author + one level of replies with their authors.
// Use only for single-comment GET where a shallow preview of replies adds value.
export const commentWithAuthorAndReplies =
  Prisma.validator<Prisma.CommentInclude>()({
    author: authorSelect,
    replies: {
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" as const },
      take: 3, // preview only - full replies are fetched via /replies endpoint
      include: { author: authorSelect },
    },
  });
