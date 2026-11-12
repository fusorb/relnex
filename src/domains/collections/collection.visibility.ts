import type { Prisma } from "@prisma-client";

// The read-access rule for collections, mirroring resource.visibility.ts.
// Collections have no draft/published lifecycle, so the rule is simpler:
//
//   - the author sees their own collection in any state
//   - everyone else sees it only when it is not PRIVATE (PUBLIC or UNLISTED)
//
// Denial is a 404 so private collections cannot be discovered by probing ids.

export interface CollectionVisibilitySubject {
  authorId: string;
  visibility: string;
}

export function canViewCollection(
  subject: CollectionVisibilitySubject,
  viewerId: string | null | undefined,
): boolean {
  if (viewerId != null && subject.authorId === viewerId) return true;
  return subject.visibility !== "PRIVATE";
}

/** The same rule as a Prisma filter, for list/scoped queries. */
export function visibleCollectionWhere(
  viewerId: string | null | undefined,
): Prisma.CollectionWhereInput {
  const visible: Prisma.CollectionWhereInput = { visibility: { in: ["PUBLIC", "UNLISTED"] } };
  return viewerId ? { OR: [{ authorId: viewerId }, visible] } : visible;
}
