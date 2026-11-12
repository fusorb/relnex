"use client";

// Unified search. Every section uses the same paginated envelope, so the caller
// never has to special-case the shape (see @/lib/pagination).
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/useful/api-client";
import type { Paginated } from "@/lib/pagination";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const SEARCH_TYPES = ["all", "resources", "collections", "users"] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export interface SearchResourceResult {
  id: string;
  title: string | null;
  description: string | null;
  type: string;
  status: string;
  visibility: string;
}

export interface SearchCollectionResult {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  visibility: string;
  author: { id: string; username: string; displayName: string | null; avatarUrl: string | null } | null;
}

export interface SearchUserResult {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  archetype: string;
}

export interface SearchResults {
  resources: Paginated<SearchResourceResult>;
  collections: Paginated<SearchCollectionResult>;
  users: Paginated<SearchUserResult>;
  query: string;
}

export function searchKey(q: string, type: SearchType, page: number, limit: number) {
  return ["search", { q, type, page, limit }] as const;
}

export function useSearch(q: string, type: SearchType = "all", page = 1, limit = 20) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: searchKey(trimmed, type, page, limit),
    queryFn: async (): Promise<SearchResults> =>
      (
        await apiClient<ApiEnvelope<SearchResults>>(
          `/api/search?q=${encodeURIComponent(trimmed)}&type=${type}&page=${page}&limit=${limit}`,
        )
      ).data,
    enabled: trimmed.length > 0,
  });
}
