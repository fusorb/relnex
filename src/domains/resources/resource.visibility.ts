import type { Prisma } from "@prisma-client";

// The single read-access rule for resources, shared by the detail surfaces, the
// list, and the flows so "who may see this?" is answered in exactly one place.
//
//   - the author sees their own resource in every state (private, draft, ...)
//   - everyone else sees it only when it is PUBLISHED and not PRIVATE
//     (i.e. PUBLIC or UNLISTED)
//
// Callers turn a "no" into 404, not 403, so private resources cannot be
// discovered by probing ids.

export interface VisibilitySubject {
  authorId: string;
  status: string;
  visibility: string;
}

export function canViewResource(
  subject: VisibilitySubject,
  viewerId: string | null | undefined,
): boolean {
  if (viewerId != null && subject.authorId === viewerId) return true;
  return subject.status === "PUBLISHED" && subject.visibility !== "PRIVATE";
}

/** The same rule expressed as a Prisma filter, for list/scoped queries. */
export function visibleResourceWhere(
  viewerId: string | null | undefined,
): Prisma.ResourceWhereInput {
  const published: Prisma.ResourceWhereInput = {
    status: "PUBLISHED",
    visibility: { in: ["PUBLIC", "UNLISTED"] },
  };
  return viewerId ? { OR: [{ authorId: viewerId }, published] } : published;
}
