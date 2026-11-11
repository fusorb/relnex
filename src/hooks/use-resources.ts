"use client";

// Resource listing hooks. Mirrors the API shapes from
// domains/resources/resources.presenter.ts (ResourceListResponse).
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/useful/api-client";

export interface ResourceListItem {
  id: string;
  title: string | null;
  description: string | null;
  excerpt: string | null;
  type: string;
  status: string;
  visibility: string;
  thumbnailUrl: string | null;
  author: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  metrics: { views: number; likes: number; bookmarks: number };
  publishedAt: string | null;
  createdAt: string;
}

export interface ResourceListResponse {
  items: ResourceListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ResourceFilters {
  limit?: number;
  page?: number;
  type?: string;
  status?: string;
  visibility?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const RESOURCE_TYPES = [
  "ARTICLE",
  "NOTE",
  "MODULE",
  "VIDEO",
  "IMAGE",
  "FILE",
  "LINK",
  "AI_OUTPUT",
] as const;

export const RESOURCE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const RESOURCE_VISIBILITIES = ["PUBLIC", "PRIVATE", "UNLISTED"] as const;

export function resourceQueryKey(filters: ResourceFilters = {}) {
  return ["resources", filters] as const;
}

function toQuery(filters: ResourceFilters): string {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 20));
  params.set("page", String(filters.page ?? 1));
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.visibility) params.set("visibility", filters.visibility);
  return params.toString();
}

export function useResources(filters: ResourceFilters = {}) {
  return useQuery({
    queryKey: resourceQueryKey(filters),
    queryFn: async (): Promise<ResourceListResponse> =>
      (await apiClient<ApiEnvelope<ResourceListResponse>>(`/api/resources?${toQuery(filters)}`)).data,
  });
}
