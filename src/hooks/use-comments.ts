"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/useful/api-client";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface CommentAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CommentItem {
  id: string;
  content: string;
  status?: string;
  authorId?: string;
  resourceId?: string;
  parentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  author?: CommentAuthor;
}

export interface PaginatedComments {
  items: CommentItem[];
  total: number;
  page?: number;
  limit?: number;
}

export function commentsKey(resourceId: string) {
  return ["resource", resourceId, "comments"] as const;
}

export function repliesKey(commentId: string) {
  return ["comment", commentId, "replies"] as const;
}

export function useResourceComments(resourceId: string) {
  return useQuery({
    queryKey: commentsKey(resourceId),
    queryFn: async (): Promise<PaginatedComments> =>
      (await apiClient<ApiEnvelope<PaginatedComments>>(`/api/resources/${resourceId}/comments`)).data,
    enabled: Boolean(resourceId),
  });
}

export function useCommentReplies(commentId: string, enabled = true) {
  return useQuery({
    queryKey: repliesKey(commentId),
    queryFn: async (): Promise<PaginatedComments> =>
      (await apiClient<ApiEnvelope<PaginatedComments>>(`/api/comments/${commentId}/replies`)).data,
    enabled: Boolean(commentId) && enabled,
  });
}

export function useCreateRootComment(resourceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) =>
      apiClient<ApiEnvelope<CommentItem>>(`/api/resources/${resourceId}/comments`, {
        method: "POST",
        bodyData: { content },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey(resourceId) });
    },
  });
}

export function useCreateReply(resourceId: string, parentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) =>
      apiClient<ApiEnvelope<CommentItem>>(`/api/comments/${parentId}`, {
        method: "POST",
        bodyData: { resourceId, content },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsKey(resourceId) });
      queryClient.invalidateQueries({ queryKey: repliesKey(parentId) });
    },
  });
}

export function useUpdateCommentStatus(resourceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { commentId: string; status: string; parentId?: string | null }) =>
      apiClient<ApiEnvelope<CommentItem>>(`/api/comments/${input.commentId}`, {
        method: "PATCH",
        bodyData: { status: input.status },
      }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: commentsKey(resourceId) });
      if (vars.parentId) queryClient.invalidateQueries({ queryKey: repliesKey(vars.parentId) });
    },
  });
}
