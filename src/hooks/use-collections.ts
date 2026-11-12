"use client";

// Collection data hooks. The list endpoint returns the standard paginated
// envelope ({ items, total, page, limit }); the detail endpoint returns the
// collection with its ordered resources.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/useful/api-client";
import type { Paginated } from "@/lib/pagination";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const COLLECTION_VISIBILITIES = ["PUBLIC", "UNLISTED", "PRIVATE"] as const;

export interface CollectionListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  visibility: string;
  resourceCount: number;
  author: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  createdAt: string;
}

export interface CollectionResourceEntry {
  id: string;
  orderIndex: number;
  resource: {
    id: string;
    title: string | null;
    type: string;
    status: string;
    visibility: string;
  };
}

export interface CollectionDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  visibility: string;
  author: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  resources: CollectionResourceEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionInput {
  title: string;
  slug: string;
  description?: string;
  visibility?: string;
}

export interface UpdateCollectionInput {
  title?: string;
  description?: string;
  visibility?: string;
}

export function collectionsKey(page: number, limit: number) {
  return ["collections", { page, limit }] as const;
}

export function collectionKey(id: string) {
  return ["collection", id] as const;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function useCollections(page = 1, limit = 50) {
  return useQuery({
    queryKey: collectionsKey(page, limit),
    queryFn: async (): Promise<Paginated<CollectionListItem>> =>
      (
        await apiClient<ApiEnvelope<Paginated<CollectionListItem>>>(
          `/api/collections?page=${page}&limit=${limit}`,
        )
      ).data,
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: collectionKey(id),
    queryFn: async (): Promise<CollectionDetail | null> => {
      try {
        return (
          await apiClient<ApiEnvelope<CollectionDetail>>(`/api/collections/${id}`)
        ).data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(id),
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCollectionInput): Promise<CollectionDetail> =>
      (
        await apiClient<ApiEnvelope<CollectionDetail>>("/api/collections", {
          method: "POST",
          bodyData: input,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useUpdateCollection(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateCollectionInput): Promise<CollectionDetail> =>
      (
        await apiClient<ApiEnvelope<CollectionDetail>>(`/api/collections/${id}`, {
          method: "PATCH",
          bodyData: input,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKey(id) });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<unknown> =>
      (await apiClient<ApiEnvelope<unknown>>(`/api/collections/${id}`, { method: "DELETE" })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useAddResourceToCollection(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resourceId: string): Promise<unknown> =>
      (
        await apiClient<ApiEnvelope<unknown>>(`/api/collections/${collectionId}/resources`, {
          method: "POST",
          bodyData: { resourceId },
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKey(collectionId) });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useRemoveResourceFromCollection(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resourceId: string): Promise<unknown> =>
      (
        await apiClient<ApiEnvelope<unknown>>(
          `/api/collections/${collectionId}/resources?resourceId=${resourceId}`,
          { method: "DELETE" },
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKey(collectionId) });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
