"use client";

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
  usePublishResource,
  useResource,
  useResourceChildren,
  type RelationEdge,
} from "@/hooks/use-resource";

function formatDate(iso: string | null): string {
  if (!iso) return "not yet";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function RelationList({ edges, direction }: { edges: RelationEdge[]; direction: "out" | "in" }) {
  if (edges.length === 0) {
    return <p className="text-xs text-muted-foreground">No {direction === "out" ? "outgoing" : "incoming"} relations yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {edges.map((edge) => (
        <li key={edge.id} className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {edge.type}
          </Badge>
          <Link
            href={`/resources/${edge.resource.id}`}
            className="truncate font-medium text-foreground hover:text-primary"
          >
            {edge.resource.title ?? "Untitled resource"}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ResourceDetailPage() {
  const params = useParams<{ resourceId: string }>();
  const id = params?.resourceId ?? "";

  const { data: resource, isLoading } = useResource(id);
  const { data: children } = useResourceChildren(id);
  const publish = usePublishResource(id);

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
            {isDraft && (
              <Button
                size="sm"
                onClick={() => publish.mutate()}
                disabled={publish.isPending}
              >
                <Icon name="send" className="size-4" aria-hidden />
                {publish.isPending ? "Publishing..." : "Publish"}
              </Button>
            )}
            <Link href={`/resources/${resource.id}/edit`}>
              <Button variant="outline" size="sm">
                <Icon name="pencil" className="size-4" aria-hidden /> Edit
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{resource.type}</Badge>
        <Badge variant={resource.status === "PUBLISHED" ? "success" : "outline"}>
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
      </div>

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

          {(incoming.length > 0 || outgoing.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Connections</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    References
                  </p>
                  <RelationList edges={outgoing} direction="out" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Referenced by
                  </p>
                  <RelationList edges={incoming} direction="in" />
                </div>
              </CardContent>
            </Card>
          )}
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
