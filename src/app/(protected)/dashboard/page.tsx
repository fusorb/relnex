"use client";

import Link from "next/link";
import { PageHeader } from "@fusorb/facet-layout";
import {
  Badge,
  Button,
  EmptyState,
  Icon,
  Skeleton,
  StatCard,
} from "@fusorb/facet-components";
import { requiresOnboarding, useMe } from "@/hooks/use-me";
import { useResources, type ResourceListItem } from "@/hooks/use-resources";
import { TOTAL_ONBOARDING_STEPS, progressPercent } from "@/lib/onboarding";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ResourceCard({ resource }: { resource: ResourceListItem }) {
  return (
    <Link
      href={`/resources/${resource.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/60"
    >
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary">{resource.type}</Badge>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {resource.status}
        </span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
        {resource.title ?? "Untitled resource"}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {resource.excerpt ?? resource.description ?? "No description yet."}
      </p>
      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Icon name="eye" className="size-3.5" aria-hidden /> {resource.metrics.views}
        </span>
        <span className="inline-flex items-center gap-1">
          <Icon name="bookmark" className="size-3.5" aria-hidden /> {resource.metrics.bookmarks}
        </span>
        <span className="ml-auto">{formatDate(resource.publishedAt ?? resource.createdAt)}</span>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: me } = useMe();
  const user = me && !requiresOnboarding(me) ? me : null;
  const { data, isLoading, isError } = useResources({ limit: 6 });

  const greeting = user?.displayName ?? user?.username ?? "there";
  const onboarding = progressPercent(user?.onboardingStep ?? TOTAL_ONBOARDING_STEPS - 1);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${greeting}`}
        description="Your knowledge graph at a glance."
        actions={
          <Link href="/resources/new">
            <Button size="sm">
              <Icon name="plus" className="size-4" aria-hidden /> New resource
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Resources" value={data?.total ?? 0} icon="library" hint="nodes in your graph" />
        <StatCard label="Collections" value={0} icon="layers" hint="lands in Phase E" />
        <StatCard label="Relations" value={0} icon="share2" hint="lands in Phase D" />
        <StatCard label="Onboarding" value={`${onboarding}%`} icon="sparkles" hint="profile setup" />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Recent resources</h2>
          <Link href="/resources" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={<Icon name="circle-alert" aria-hidden />}
            title="We couldn't load your resources"
            description="Your session may have expired. Refresh to try again."
          />
        ) : data && data.items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Icon name="library" aria-hidden />}
            title="No resources yet"
            description="Create your first resource to start building your knowledge graph."
            action={
              <Link href="/resources/new">
                <Button size="sm">Create a resource</Button>
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
