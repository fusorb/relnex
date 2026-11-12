/**
 * Resource presenter - transforms Resource model to API-safe response shapes.
 */

import type { Resource, ResourceMetrics } from "@prisma-client";
import { presentPublicUser, type PublicUser } from "../users/users.presenter";

// ── Tag shape ───────────────────────────────────────────────────────────

export interface TagShape {
  id: string;
  name: string;
  slug: string;
}

export function presentTag(tag: { id: string; name: string; slug: string }): TagShape {
  return { id: tag.id, name: tag.name, slug: tag.slug };
}

// ── Metrics shape ───────────────────────────────────────────────────────

export interface ResourceMetricsShape {
  views: number;
  opens: number;
  downloads: number;
  shares: number;
  likes: number;
  bookmarks: number;
  comments: number;
  engagementScore: number;
}

export function presentMetrics(
  metrics: ResourceMetrics | null
): ResourceMetricsShape {
  return {
    views: metrics?.views ?? 0,
    opens: metrics?.opens ?? 0,
    downloads: metrics?.downloads ?? 0,
    shares: metrics?.shares ?? 0,
    likes: metrics?.likes ?? 0,
    bookmarks: metrics?.bookmarks ?? 0,
    comments: metrics?.comments ?? 0,
    engagementScore: metrics?.engagementScore ?? 0,
  };
}

// ── Full resource response ──────────────────────────────────────────────

export interface ResourceResponse {
  id: string;
  tenantId: string | null;
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
  author: PublicUser;
  tags: TagShape[];
  metrics: ResourceMetricsShape;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function presentResource(
  resource: Resource & {
    author: { id: string; username: string; displayName: string | null; avatarUrl: string | null; bio: string | null; archetype: string; createdAt: Date };
    metrics: ResourceMetrics | null;
    resourceTags: Array<{ tag: { id: string; name: string; slug: string } }>;
  }
): ResourceResponse {
  return {
    id: resource.id,
    tenantId: resource.tenantId,
    slug: resource.slug,
    title: resource.title,
    description: resource.description,
    excerpt: resource.excerpt,
    type: resource.type,
    status: resource.status,
    visibility: resource.visibility,
    category: resource.category,
    language: resource.language,
    thumbnailUrl: resource.thumbnailUrl,
    coverImageUrl: resource.coverImageUrl,
    fileUrl: resource.fileUrl,
    wordCount: resource.wordCount,
    estimatedTime: resource.estimatedTime,
    author: presentPublicUser(resource.author),
    tags: resource.resourceTags.map((rt) => presentTag(rt.tag)),
    metrics: presentMetrics(resource.metrics),
    publishedAt: resource.publishedAt?.toISOString() ?? null,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
  };
}

// ── List item (lighter response for listings) ──────────────────────────

export interface ResourceListItem {
  id: string;
  title: string | null;
  description: string | null;
  excerpt: string | null;
  type: string;
  status: string;
  visibility: string;
  thumbnailUrl: string | null;
  author: Pick<PublicUser, "id" | "username" | "displayName" | "avatarUrl">;
  metrics: Pick<ResourceMetricsShape, "views" | "likes" | "bookmarks">;
  publishedAt: string | null;
  createdAt: string;
}

export function presentResourceListItem(
  resource: Resource & {
    author: { id: string; username: string; displayName: string | null; avatarUrl: string | null; bio: string | null; archetype: string; createdAt: Date };
    metrics: ResourceMetrics | null;
  }
): ResourceListItem {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    excerpt: resource.excerpt,
    type: resource.type,
    status: resource.status,
    visibility: resource.visibility,
    thumbnailUrl: resource.thumbnailUrl,
    author: {
      id: resource.author.id,
      username: resource.author.username,
      displayName: resource.author.displayName,
      avatarUrl: resource.author.avatarUrl,
    },
    metrics: {
      views: resource.metrics?.views ?? 0,
      likes: resource.metrics?.likes ?? 0,
      bookmarks: resource.metrics?.bookmarks ?? 0,
    },
    publishedAt: resource.publishedAt?.toISOString() ?? null,
    createdAt: resource.createdAt.toISOString(),
  };
}

// ── Paginated list ──────────────────────────────────────────────────────

export interface ResourceListResponse {
  items: ResourceListItem[];
  total: number;
  page: number;
  limit: number;
}

export function presentResourceList(
  resources: Array<Resource & { author: { id: string; username: string; displayName: string | null; avatarUrl: string | null; bio: string | null; archetype: string; createdAt: Date }; metrics: ResourceMetrics | null }>,
  total: number,
  page: number,
  limit: number
): ResourceListResponse {
  return {
    items: resources.map(presentResourceListItem),
    total,
    page,
    limit,
  };
}