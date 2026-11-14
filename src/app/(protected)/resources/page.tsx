"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@fusorb/facet-layout";
import { Badge, Button, EmptyState, Icon, Skeleton } from "@fusorb/facet-components";
import { RESOURCE_STATUSES, RESOURCE_TYPES, useBulkResources, useResources } from "@/hooks/use-resources";

const PAGE_SIZE = 12;

const selectClass =
  "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring";

export default function ResourcesPage() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const { data, isLoading, isError } = useResources({
    type: type || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const bulk = useBulkResources();

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const selectedCount = selected.size;
  const allVisibleSelected =
    !!data && data.items.length > 0 && data.items.every((r) => selected.has(r.id));

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    if (!data) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const r of data.items) next.delete(r.id);
      } else {
        for (const r of data.items) next.add(r.id);
      }
      return next;
    });
  }

  async function runBulk(action: "ARCHIVE" | "DELETE") {
    if (selectedCount === 0) return;
    const ids = Array.from(selected);
    const label = action === "DELETE" ? "delete" : "archive";
    if (typeof window !== "undefined" && !window.confirm(`Are you sure you want to ${label} ${ids.length} selected resource${ids.length === 1 ? "" : "s"}?`)) {
      return;
    }
    setBulkError(null);
    setBulkMessage(null);
    try {
      const res = await bulk.mutateAsync({ ids, action });
      setBulkMessage(res.message ?? `Processed ${ids.length} resource(s).`);
      if (res.data.failed.length > 0) {
        setBulkError(`${res.data.failed.length} item(s) failed (you may not own them or they can't be ${label}d).`);
      }
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of res.data.successful) next.delete(id);
        return next;
      });
    } catch (err) {
      setBulkError((err as Error).message || "Bulk action failed.");
    }
  }

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
            setSelected(new Set());
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
            setSelected(new Set());
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

      {data && data.items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
              aria-label="Select all visible resources"
            />
            <span className="text-muted-foreground">Select page</span>
          </label>
          {selectedCount > 0 && (
            <>
              <span className="text-muted-foreground">{selectedCount} selected</span>
              <Button size="sm" variant="outline" disabled={bulk.isPending} onClick={() => runBulk("ARCHIVE")}>
                <Icon name="archive" className="size-4" aria-hidden /> Archive
              </Button>
              <Button size="sm" variant="outline" disabled={bulk.isPending} onClick={() => runBulk("DELETE")}>
                <Icon name="trash-2" className="size-4" aria-hidden /> Delete
              </Button>
              <Button size="sm" variant="ghost" disabled={bulk.isPending} onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </>
          )}
        </div>
      )}

      {(bulkError || bulkMessage) && (
        <div className="space-y-1">
          {bulkMessage && <p className="text-sm text-muted-foreground">{bulkMessage}</p>}
          {bulkError && <p className="text-sm text-destructive">{bulkError}</p>}
        </div>
      )}

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
          {data.items.map((resource) => {
            const checked = selected.has(resource.id);
            return (
              <div
                key={resource.id}
                className={`group relative flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/60 ${checked ? "border-primary/60 ring-1 ring-primary/30" : "border-border"}`}
              >
                <label className="absolute right-3 top-3 z-10 flex items-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelected(resource.id)}
                    aria-label={`Select ${resource.title ?? "resource"}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
                <Link href={`/resources/${resource.id}`} className="flex flex-col pr-6">
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
              </div>
            );
          })}
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
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              setSelected(new Set());
            }}
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
            onClick={() => {
              setPage((p) => p + 1);
              setSelected(new Set());
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
