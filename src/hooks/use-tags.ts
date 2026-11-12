"use client";

// Tag data hooks - the taxonomy across resources. The list endpoint returns the
// standard paginated envelope with a per-tag resourceCount.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/useful/api-client";
import type { Paginated } from "@/lib/pagination";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface TagListItem {
  id: string;
  name: string;
  slug: string;
  resourceCount: number;
}

export function tagsKey(page: number, limit: number) {
  return ["tags", { page, limit }] as const;
}

export function useTags(page = 1, limit = 100) {
  return useQuery({
    queryKey: tagsKey(page, limit),
    queryFn: async (): Promise<Paginated<TagListItem>> =>
      (
        await apiClient<ApiEnvelope<Paginated<TagListItem>>>(`/api/tags?page=${page}&limit=${limit}`)
      ).data,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<TagListItem> =>
      (
        await apiClient<ApiEnvelope<TagListItem>>("/api/tags", {
          method: "POST",
          bodyData: { name },
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
