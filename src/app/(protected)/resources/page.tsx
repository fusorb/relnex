"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@fusorb/facet-layout";
import { Badge, Button, EmptyState, Icon, Skeleton } from "@fusorb/facet-components";
import { RESOURCE_STATUSES, RESOURCE_TYPES, useResources } from "@/hooks/use-resources";

const PAGE_SIZE = 12;

const selectClass =
  "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring";

export default function ResourcesPage() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useResources({
    type: type || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources"
        description="Every node in your knowledge graph."
        actions={
          <Link href="/resources/new">
            <Button size="sm">
              <Icon name="plus" className="size-4" aria-hidden /> New resource
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <select
          className={selectClass}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          {RESOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {RESOURCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {data && <span className="text-sm text-muted-foreground">{data.total} total</span>}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Icon name="circle-alert" aria-hidden />}
          title="We couldn't load your resources"
          description="Refresh the page and try again."
        />
      ) : data && data.items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((resource) => (
            <Link
              key={resource.id}
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
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Icon name="library" aria-hidden />}
          title="No resources match"
          description="Adjust the filters, or create your first resource."
          action={
            <Link href="/resources/new">
              <Button size="sm">Create a resource</Button>
            </Link>
          }
        />
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
