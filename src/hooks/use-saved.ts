"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/useful/api-client";
import { resourceDetailKey } from "@/hooks/use-resource";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface SavedResourceEntry {
  id?: string;
  userId?: string;
  resourceId?: string;
  createdAt?: string;
  resource?: {
    id: string;
    title?: string | null;
    slug?: string | null;
    description?: string | null;
    excerpt?: string | null;
    type?: string;
    status?: string;
    visibility?: string;
    thumbnailUrl?: string | null;
    authorId?: string;
  };
}

export const SAVED_RESOURCES_KEY = ["saved-resources"] as const;

export function useSavedResources(enabled = true) {
  return useQuery({
    queryKey: SAVED_RESOURCES_KEY,
    queryFn: async (): Promise<SavedResourceEntry[]> =>
      (await apiClient<ApiEnvelope<SavedResourceEntry[]>>("/api/resources/saved")).data ?? [],
    enabled,
  });
}

export function useIsResourceSaved(resourceId: string, enabled = true) {
  return useQuery({
    queryKey: [...SAVED_RESOURCES_KEY, "status", resourceId] as const,
    queryFn: async (): Promise<boolean> => {
      const saved = (await apiClient<ApiEnvelope<SavedResourceEntry[]>>("/api/resources/saved")).data ?? [];
      return saved.some((entry) => entry.resourceId === resourceId || entry.resource?.id === resourceId);
    },
    enabled: enabled && Boolean(resourceId),
  });
}

export function useToggleSaveResource(resourceId: string, isSaved: boolean) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      apiClient<ApiEnvelope<unknown>>(`/api/resources/${resourceId}/save`, {
        method: isSaved ? "DELETE" : "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_RESOURCES_KEY });
      queryClient.invalidateQueries({ queryKey: resourceDetailKey(resourceId) });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}
