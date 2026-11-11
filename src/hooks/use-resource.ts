"use client";

// Resource read/write hooks. Mirrors the API shapes: the list route returns
// ResourceListResponse; the detail route returns the repository's findById
// result (author, metrics, resourceTags, parent, relations in/out, collections).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/useful/api-client";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface ResourceTagRef {
  id: string;
  name: string;
  slug: string;
}

export interface RelatedResource {
  id: string;
  title: string | null;
  slug: string | null;
  type: string;
  status: string;
}

export interface RelationEdge {
  id: string;
  type: string;
  resource: RelatedResource;
}

export interface CollectionRef {
  id: string;
  title: string;
  slug: string;
}

export interface ParentRef {
  id: string;
  title: string | null;
  slug: string | null;
  type: string;
}

export interface ResourceDetail {
  id: string;
  tenantId: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  excerpt: string | null;
  type: string;
  status: string;
  visibility: string;
  category: string | null;
  language: string;
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  fileUrl: string | null;
  wordCount: number | null;
  estimatedTime: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    archetype: string;
  };
  metrics: { views: number; likes: number; bookmarks: number } | null;
  resourceTags: { tag: ResourceTagRef }[];
  parent: ParentRef | null;
  outgoingRelations: { id: string; type: string; to: RelatedResource }[];
  incomingRelations: { id: string; type: string; from: RelatedResource }[];
  collections: { id: string; collection: CollectionRef }[];
}

export interface ResourceChild {
  id: string;
  title: string | null;
  slug: string;
  type: string;
  status: string;
  author: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
}

export interface ResourceChildrenResponse {
  children: ResourceChild[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateResourceInput {
  title?: string;
  description?: string;
  excerpt?: string;
  type: string;
  visibility?: string;
  category?: string;
  language?: string;
  parentId?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  fileUrl?: string;
  tags?: string[];
}

export interface UpdateResourceInput {
  title?: string;
  description?: string;
  excerpt?: string;
  visibility?: string;
  category?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
}

export function resourceDetailKey(id: string) {
  return ["resource", id] as const;
}

export function useResource(id: string) {
  return useQuery({
    queryKey: resourceDetailKey(id),
    queryFn: async (): Promise<ResourceDetail | null> => {
      try {
        return (await apiClient<ApiEnvelope<ResourceDetail>>(`/api/resources/${id}`)).data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(id),
  });
}

export function useResourceChildren(id: string) {
  return useQuery({
    queryKey: ["resource", id, "children"],
    queryFn: async (): Promise<ResourceChildrenResponse> =>
      (await apiClient<ApiEnvelope<ResourceChildrenResponse>>(`/api/resources/${id}/children?limit=50`))
        .data,
    enabled: Boolean(id),
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateResourceInput): Promise<ResourceDetail> =>
      (await apiClient<ApiEnvelope<ResourceDetail>>("/api/resources", { method: "POST", bodyData: input }))
        .data,
    onSuccess: () => {
      // Invalidate both precise and prefix resource lists.
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function useUpdateResource(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateResourceInput): Promise<ResourceDetail> =>
      (
        await apiClient<ApiEnvelope<ResourceDetail>>(`/api/resources/${id}`, {
          method: "PATCH",
          bodyData: input,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceDetailKey(id) });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}

export function usePublishResource(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<ResourceDetail> =>
      (
        await apiClient<ApiEnvelope<ResourceDetail>>(`/api/resources/${id}/publish`, {
          method: "POST",
        })
      ).data,
    onSuccess: (resource) => {
      queryClient.setQueryData(resourceDetailKey(id), resource);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}
