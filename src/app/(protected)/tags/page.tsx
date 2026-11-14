"use client";

import { useState } from "react";
import { PageHeader } from "@fusorb/facet-layout";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Icon,
  Input,
  Label,
  Skeleton,
} from "@fusorb/facet-components";
import { useCreateTag, useDeleteTag, useMergeTag, useTags, useUpdateTag, type TagListItem } from "@/hooks/use-tags";

const PAGE_SIZE = 100;

function TagRow({
  tag,
  allTags,
}: {
  tag: TagListItem;
  allTags: TagListItem[];
}) {
  const update = useUpdateTag();
  const del = useDeleteTag();
  const merge = useMergeTag();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [mergeTarget, setMergeTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveRename() {
    const value = name.trim();
    if (!value || value === tag.name) {
      setEditing(false);
      setName(tag.name);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await update.mutateAsync({ id: tag.id, name: value });
      setEditing(false);
    } catch (err) {
      setError((err as Error).message || "Could not rename tag.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (typeof window !== "undefined" && !window.confirm(`Delete tag "${tag.name}"? This removes it from all resources.`)) return;
    setBusy(true);
    setError(null);
    try {
      await del.mutateAsync(tag.id);
    } catch (err) {
      setError((err as Error).message || "Could not delete tag.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMerge() {
    if (!mergeTarget) return;
    const target = allTags.find((t) => t.id === mergeTarget);
    if (!target) return;
    if (typeof window !== "undefined" && !window.confirm(`Merge "${tag.name}" into "${target.name}"? "${tag.name}" will be removed.`)) return;
    setBusy(true);
    setError(null);
    try {
      await merge.mutateAsync({ id: tag.id, intoTagId: mergeTarget });
      setMergeTarget("");
    } catch (err) {
      setError((err as Error).message || "Could not merge tags.");
    } finally {
      setBusy(false);
    }
  }

  const mergeOptions = allTags.filter((t) => t.id !== tag.id);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          {editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 max-w-xs"
                aria-label={`Rename ${tag.name}`}
              />
              <Button size="sm" onClick={saveRename} disabled={busy || !name.trim()}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setName(tag.name); }} disabled={busy}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{tag.name}</span>
              <span className="text-xs text-muted-foreground">{tag.slug}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {tag.resourceCount} resources
              </span>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        {!editing && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={busy}>
              Rename
            </Button>
            <Button size="sm" variant="outline" onClick={handleDelete} disabled={busy}>
              {busy && del.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}
      </div>
      {!editing && mergeOptions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor={`merge-${tag.id}`} className="text-xs text-muted-foreground">Merge into</Label>
            <select
              id={`merge-${tag.id}`}
              className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
              value={mergeTarget}
              onChange={(e) => setMergeTarget(e.target.value)}
              disabled={busy}
            >
              <option value="">Select target tag...</option>
              {mergeOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <Button size="sm" variant="outline" onClick={handleMerge} disabled={busy || !mergeTarget}>
            {busy && merge.isPending ? "Merging..." : "Merge"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function TagsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useTags(page, PAGE_SIZE);
  const create = useCreateTag();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = name.trim();
    if (!value) return;
    setError(null);
    try {
      await create.mutateAsync(value);
      setName("");
    } catch (err) {
      setError((err as Error).message || "Could not create the tag.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tags" description="Manage the taxonomy across your resources." />

      <Card>
        <CardHeader>
          <CardTitle>New tag</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex max-w-md items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. systems-thinking"
              />
            </div>
            <Button type="submit" size="sm" disabled={create.isPending || !name.trim()}>
              {create.isPending ? "Adding..." : "Add"}
            </Button>
          </form>
          {error && (
            <p className="mt-2 max-w-md rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Icon name="circle-alert" aria-hidden />}
          title="We couldn't load your tags"
          description="Refresh the page and try again."
        />
      ) : data && data.items.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">{data.total} tags</p>
          <div className="space-y-3">
            {data.items.map((tag) => (
              <TagRow key={tag.id} tag={tag} allTags={data.items} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Icon name="tags" aria-hidden />}
          title="No tags yet"
          description="Tags appear here once you attach them to resources."
        />
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
