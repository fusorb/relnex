/**
 * Collection presenter - transforms Collection model to API-safe response shapes.
 */

import type { Collection, CollectionResource, Resource } from "@prisma-client";
import { presentPublicUser, type PublicUser } from "../users/users.presenter";
import { presentResourceListItem, type ResourceListItem } from "../resources/resources.presenter";

// ── Collection item (within a list) ────────────────────────────────────

export interface CollectionListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  visibility: string;
  resourceCount: number;
  author: Pick<PublicUser, "id" | "username" | "displayName" | "avatarUrl">;
  createdAt: string;
}

export function presentCollectionListItem(
  collection: Collection & {
    author: { id: string; username: string; displayName: string | null; avatarUrl: string | null; bio: string | null; archetype: string; createdAt: Date };
    _count?: { resources: number };
  }
): CollectionListItem {
  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    description: collection.description,
    visibility: collection.visibility,
    resourceCount: collection._count?.resources ?? 0,
    author: {
      id: collection.author.id,
      username: collection.author.username,
      displayName: collection.author.displayName,
      avatarUrl: collection.author.avatarUrl,
    },
    createdAt: collection.createdAt.toISOString(),
  };
}

// ── Full collection response (with resources) ───────────────────────────

export interface CollectionResourceShape {
  id: string;
  orderIndex: number;
  resource: ResourceListItem;
}

export interface CollectionResponse {
  id: string;
  tenantId: string | null;
  slug: string;
  title: string;
  description: string | null;
  visibility: string;
  metadata: Record<string, unknown> | null;
  author: PublicUser;
  resources: CollectionResourceShape[];
  createdAt: string;
  updatedAt: string;
}

export function presentCollection(
  collection: Collection & {
    author: { id: string; username: string; displayName: string | null; avatarUrl: string | null; bio: string | null; archetype: string; createdAt: Date };
    resources: Array<CollectionResource & { resource: Resource & { author: { id: string; username: string; displayName: string | null; avatarUrl: string | null; bio: string | null; archetype: string; createdAt: Date }; metrics: { views: number; opens: number; downloads: number; shares: number; likes: number; bookmarks: number; comments: number; engagementScore: number } | null } }>;
  }
): CollectionResponse {
  return {
    id: collection.id,
    tenantId: collection.tenantId,
    slug: collection.slug,
    title: collection.title,
    description: collection.description,
    visibility: collection.visibility,
    metadata: collection.metadata as Record<string, unknown> | null,
    author: presentPublicUser(collection.author),
    resources: collection.resources
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((cr) => ({
        id: cr.resource.id,
        orderIndex: cr.orderIndex,
        resource: presentResourceListItem(cr.resource as Parameters<typeof presentResourceListItem>[0]),
      })),
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

// ── Paginated list ──────────────────────────────────────────────────────

export interface CollectionListResponse {
  items: CollectionListItem[];
  total: number;
  page: number;
  limit: number;
}

// ── Legacy compatibility (used by existing routes) ─────────────────────

export type CollectionDTO = CollectionResponse;

export function toSafeCollectionDTO(
  collection: Collection & {
    author: { id: string; username: string; displayName: string | null; avatarUrl: string | null; bio: string | null; archetype: string; createdAt: Date };
    resources: Array<CollectionResource & { resource: Resource & { author: { id: string; username: string; displayName: string | null; avatarUrl: string | null; bio: string | null; archetype: string; createdAt: Date }; metrics: { views: number; opens: number; downloads: number; shares: number; likes: number; bookmarks: number; comments: number; engagementScore: number } | null } }>;
  }
): CollectionDTO {
  return presentCollection(collection);
}