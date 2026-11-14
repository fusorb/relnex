"use client";

import Link from "next/link";
import { PageHeader } from "@fusorb/facet-layout";
import { Badge, Button, EmptyState, Icon, Skeleton } from "@fusorb/facet-components";
import { requiresOnboarding, useMe } from "@/hooks/use-me";
import { useSavedResources, type SavedResourceEntry } from "@/hooks/use-saved";

type SavedResourceView = NonNullable<SavedResourceEntry["resource"]> & { id: string };

function pickResource(entry: SavedResourceEntry): SavedResourceView | null {
  const resource = (entry.resource ?? entry) as Partial<SavedResourceView> | undefined;
  return resource && typeof resource.id === "string" ? (resource as SavedResourceView) : null;
}

export default function SavedResourcesPage() {
  const { data: me, isLoading: meLoading } = useMe();
  const isAuthed = !requiresOnboarding(me) && Boolean((me as { id?: string } | null)?.id);
  const { data, isLoading, isError } = useSavedResources(isAuthed);

  if (meLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <EmptyState
        icon={<Icon name="bookmark" aria-hidden />}
        title="Saved resources"
        description="Sign in and complete onboarding to view your saved resources."
      />
    );
  }

  const items = (data ?? [])
    .map((entry) => ({ entry, resource: pickResource(entry) }))
    .filter(
      (item): item is { entry: SavedResourceEntry; resource: SavedResourceView } =>
        item.resource !== null,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved"
        description="Resources you've bookmarked for quick access."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Icon name="circle-alert" aria-hidden />}
          title="Couldn’t load saved resources"
          description="Refresh the page and try again."
        />
      ) : items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ resource }) => (
            <Link
              key={resource.id}
              href={`/resources/${resource.id}`}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/60"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary">{resource.type ?? "RESOURCE"}</Badge>
                {resource.status && (
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {resource.status}
                  </span>
                )}
              </div>
              <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                {resource.title ?? "Untitled resource"}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {resource.excerpt ?? resource.description ?? "No description yet."}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Icon name="bookmark" aria-hidden />}
          title="No saved resources yet"
          description="Save resources from their detail page to collect them here."
          action={
            <Link href="/resources">
              <Button size="sm">Browse resources</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
