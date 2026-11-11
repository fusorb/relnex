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

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export function resourceQueryKey(limit: number, page: number) {
  return ["resources", { limit, page }] as const;
}

export function useResources({ limit = 20, page = 1 }: { limit?: number; page?: number } = {}) {
  return useQuery({
    queryKey: resourceQueryKey(limit, page),
    queryFn: async (): Promise<ResourceListResponse> =>
      (await apiClient<ApiEnvelope<ResourceListResponse>>(`/api/resources?limit=${limit}&page=${page}`))
        .data,
  });
}
