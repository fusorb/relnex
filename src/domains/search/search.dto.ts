import { z } from "zod";
export const SearchDto = z.object({
  q:        z.string().min(1).max(200),
  type:     z.enum(["resources","users","collections","all"]).default("all"),
  tenantId: z.string().nullable().optional(),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(10),
});
export type SearchInput = z.infer<typeof SearchDto>;

export interface SearchFiltersDto {
  q: string;
  type?: "resource" | "collection" | "user";
  page?: number;
  limit?: number;
  tenantId?: string | null;
}

export const resourceSearchSchema = z.object({
  q:        z.string().optional(),
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(50).default(20),
  tenantId: z.string().nullable().optional(),
});

export const unifiedSearchSchema = z.object({
  q:        z.string().min(1),
  // Which entity types to search. Without this the unified route always searched
  // everything (zod silently dropped the unknown `type` param).
  type:     z.enum(["resources", "collections", "users", "all"]).default("all"),
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(50).default(20),
  tenantId: z.string().nullable().optional(),
});

export function toCollectionSearchResultDTO(item: {
  id: string; title: string; slug: string | null; description: string | null;
  visibility: string; author: { id: string; username: string; displayName: string | null; avatarUrl: string | null } | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    id: item.id, title: item.title, slug: item.slug,
    description: item.description, visibility: item.visibility,
    author: item.author
      ? { id: item.author.id, username: item.author.username, displayName: item.author.displayName, avatarUrl: item.author.avatarUrl }
      : null,
    createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(),
  };
}

export function toUserSearchResultDTO(user: {
  id: string; username: string; displayName: string | null; avatarUrl: string | null;
  bio: string | null; archetype: string; createdAt: Date;
}) {
  return {
    id: user.id, username: user.username, displayName: user.displayName,
    avatarUrl: user.avatarUrl, bio: user.bio, archetype: user.archetype,
    createdAt: user.createdAt.toISOString(),
  };
}
