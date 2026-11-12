"use client";

import { useState } from "react";
import { PageHeader } from "@fusorb/facet-layout";
import {
  Button,
  EmptyState,
  Icon,
  Input,
  Label,
  Skeleton,
} from "@fusorb/facet-components";
import { useCreateTag, useTags } from "@/hooks/use-tags";

export default function TagsPage() {
  const { data, isLoading, isError } = useTags(1, 200);
  const create = useCreateTag();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      <PageHeader title="Tags" description="The taxonomy across your resources." />

      <form onSubmit={handleSubmit} className="flex max-w-md items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="tag-name">New tag</Label>
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
        <p className="max-w-md rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
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
          <div className="flex flex-wrap gap-2">
            {data.items.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground"
              >
                {tag.name}
                <span className="text-xs text-muted-foreground">{tag.resourceCount}</span>
              </span>
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
    </div>
  );
}
