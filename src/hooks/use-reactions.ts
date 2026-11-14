"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/useful/api-client";
import { resourceDetailKey } from "@/hooks/use-resource";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface ReactionUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ReactionItem {
  id: string;
  userId: string;
  resourceId: string;
  type: string;
  createdAt?: string;
  user?: ReactionUser;
}

export interface PaginatedReactions {
  items: ReactionItem[];
  total: number;
  page: number;
  limit: number;
}

export function reactionsKey(resourceId: string) {
  return ["resource", resourceId, "reactions"] as const;
}

export function useResourceReactions(resourceId: string, viewerId?: string | null) {
  return useQuery({
    queryKey: reactionsKey(resourceId),
    queryFn: async (): Promise<PaginatedReactions> =>
      (
        await apiClient<ApiEnvelope<PaginatedReactions>>(
          `/api/resources/${resourceId}/reactions?limit=100`,
        )
      ).data,
    enabled: Boolean(resourceId),
    select: (data) => {
      const reacted = viewerId ? data.items.some((r) => r.userId === viewerId) : false;
      return { ...data, reacted };
    },
  });
}

export function useToggleLike(resourceId: string, reacted: boolean) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      apiClient<ApiEnvelope<unknown>>(`/api/resources/${resourceId}/reactions`, {
        method: reacted ? "DELETE" : "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reactionsKey(resourceId) });
      queryClient.invalidateQueries({ queryKey: resourceDetailKey(resourceId) });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}
