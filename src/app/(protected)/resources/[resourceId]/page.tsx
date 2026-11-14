"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@fusorb/facet-layout";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Icon,
  Skeleton,
} from "@fusorb/facet-components";
import {
  useArchiveResource,
  usePublishResource,
  useResource,
  useResourceChildren,
  useUnarchiveResource,
  type RelationEdge,
} from "@/hooks/use-resource";
import { requiresOnboarding, useMe } from "@/hooks/use-me";
import { useIsResourceSaved, useToggleSaveResource } from "@/hooks/use-saved";
import { useResourceReactions, useToggleLike } from "@/hooks/use-reactions";
import { ResourceComments } from "@/components/resources/resource-comments";
import { ResourceConnections } from "@/components/resources/resource-connections";
import { apiClient } from "@/lib/useful/api-client";

function formatDate(iso: string | null): string {
  if (!iso) return "not yet";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ResourceDetailPage() {
  const params = useParams<{ resourceId: string }>();
  const id = params?.resourceId ?? "";

  const { data: resource, isLoading } = useResource(id);
  const { data: children } = useResourceChildren(id);
  const { data: me } = useMe();
  const publish = usePublishResource(id);
  const archive = useArchiveResource(id);
  const unarchive = useUnarchiveResource(id);
  const viewerId = !requiresOnboarding(me) ? me?.id ?? null : null;
  const { data: savedStatus } = useIsResourceSaved(id, Boolean(viewerId));
  const toggleSave = useToggleSaveResource(id, Boolean(savedStatus));
  const { data: reactions } = useResourceReactions(id, viewerId);
  const toggleLike = useToggleLike(id, Boolean(reactions?.reacted));

  useEffect(() => {
    if (!id || !resource) return;
    // Fire-and-forget view telemetry (endpoint is 202 Accepted).
    void apiClient(`/api/resources/${id}/usage`, {
      method: "POST",
      bodyData: { event: "VIEW" },
    }).catch(() => {
      // Telemetry must never block or break the read experience.
    });
  }, [id, resource]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!resource) {
    return (
      <EmptyState
        icon={<Icon name="search-x" aria-hidden />}
        title="Resource not found"
        description="It may have been deleted, or belongs to another workspace."
        action={
          <Link href="/resources">
            <Button variant="outline" size="sm">
              Back to resources
            </Button>
          </Link>
        }
      />
    );
  }

  const isDraft = resource.status === "DRAFT";
  const isArchived = resource.status === "ARCHIVED";
  const isOwner = !requiresOnboarding(me) && me?.id === resource.author.id;

  const outgoing: RelationEdge[] = resource.outgoingRelations.map((r) => ({
    id: r.id,
    type: r.type,
    resource: r.to,
  }));
  const incoming: RelationEdge[] = resource.incomingRelations.map((r) => ({
    id: r.id,
    type: r.type,
    resource: r.from,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={resource.title ?? "Untitled resource"}
        description={resource.excerpt ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {isOwner && isDraft && (
              <Button
                size="sm"
                onClick={() => publish.mutate()}
                disabled={publish.isPending}
              >
                <Icon name="send" className="size-4" aria-hidden />
                {publish.isPending ? "Publishing..." : "Publish"}
              </Button>
            )}
            {isOwner && !isArchived && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => archive.mutate()}
                disabled={archive.isPending}
              >
                <Icon name="archive" className="size-4" aria-hidden />
                {archive.isPending ? "Archiving..." : "Archive"}
              </Button>
            )}
            {isOwner && isArchived && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => unarchive.mutate()}
                disabled={unarchive.isPending}
              >
                <Icon name="archive-restore" className="size-4" aria-hidden />
                {unarchive.isPending ? "Restoring..." : "Unarchive"}
              </Button>
            )}
            {isOwner && (
              <Link href={`/resources/${resource.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Icon name="pencil" className="size-4" aria-hidden /> Edit
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{resource.type}</Badge>
        <Badge
          variant={
            resource.status === "PUBLISHED"
              ? "success"
              : resource.status === "ARCHIVED"
                ? "destructive"
                : "outline"
          }
        >
          {resource.status}
        </Badge>
        <Badge variant="outline">{resource.visibility}</Badge>
        <span className="ml-1">by {resource.author.displayName ?? resource.author.username}</span>
        <span>·</span>
        <span>created {formatDate(resource.createdAt)}</span>
        {resource.publishedAt && (
          <>
            <span>·</span>
            <span>published {formatDate(resource.publishedAt)}</span>
          </>
        )}
        <span>·</span>
        <span>{resource.metrics?.views ?? 0} views</span>
        <span>·</span>
        <span>{resource.metrics?.likes ?? 0} likes</span>
        <span>·</span>
        <span>{resource.metrics?.bookmarks ?? 0} saves</span>
      </div>

      {viewerId && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={reactions?.reacted ? "default" : "outline"}
            onClick={() => toggleLike.mutate()}
            disabled={toggleLike.isPending}
          >
            <Icon name="heart" className="size-4" aria-hidden />
            {reactions?.reacted ? "Liked" : "Like"}
          </Button>
          <Button
            size="sm"
            variant={savedStatus ? "default" : "outline"}
            onClick={() => toggleSave.mutate()}
            disabled={toggleSave.isPending}
          >
            <Icon name="bookmark" className="size-4" aria-hidden />
            {savedStatus ? "Saved" : "Save"}
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {resource.description ? (
                <p className="whitespace-pre-wrap">{resource.description}</p>
              ) : (
                <p>No description yet.</p>
              )}
              {resource.fileUrl && (
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Icon name="paperclip" className="size-4" aria-hidden /> Attached file
                </a>
              )}
            </CardContent>
          </Card>

          <ResourceConnections
            resourceId={resource.id}
            canEdit={isOwner}
            outgoing={outgoing}
            incoming={incoming}
          />

          <ResourceComments resourceId={resource.id} viewerId={viewerId} isOwner={isOwner} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hierarchy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {resource.parent ? (
                <div>
                  <p className="text-xs text-muted-foreground">Parent</p>
                  <Link
                    href={`/resources/${resource.parent.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {resource.parent.title ?? "Untitled resource"}
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Top-level resource.</p>
              )}
              <div>
                <p className="text-xs text-muted-foreground">
                  Children {children ? `(${children.total})` : ""}
                </p>
                {children && children.children.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {children.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/resources/${child.id}`}
                          className="text-sm text-foreground hover:text-primary"
                        >
                          {child.title ?? "Untitled resource"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">No children.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collections</CardTitle>
            </CardHeader>
            <CardContent>
              {resource.collections.length > 0 ? (
                <ul className="space-y-1.5">
                  {resource.collections.map((entry) => (
                    <li
                      key={entry.id}
                      className="inline-flex items-center gap-1.5 text-sm text-foreground"
                    >
                      <Icon name="layers" className="size-4 text-muted-foreground" aria-hidden />
                      {entry.collection.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Not in any collection yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {resource.resourceTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {resource.resourceTags.map(({ tag }) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No tags yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
