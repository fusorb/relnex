"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@fusorb/facet-layout";
import { Button, Input, Label, Skeleton, Textarea } from "@fusorb/facet-components";
import { RESOURCE_VISIBILITIES } from "@/hooks/use-resources";
import { useResource, useUpdateResource } from "@/hooks/use-resource";

const selectClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring";

export default function EditResourcePage() {
  const params = useParams<{ resourceId: string }>();
  const id = params?.resourceId ?? "";
  const router = useRouter();

  const { data: resource, isLoading } = useResource(id);
  const update = useUpdateResource(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [category, setCategory] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resource) return;
    setTitle(resource.title ?? "");
    setDescription(resource.description ?? "");
    setExcerpt(resource.excerpt ?? "");
    setVisibility(resource.visibility);
    setCategory(resource.category ?? "");
    setCoverImageUrl(resource.coverImageUrl ?? "");
  }, [resource]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!resource) {
    return (
      <p className="text-sm text-muted-foreground">
        Resource not found.{" "}
        <Link href="/resources" className="text-primary hover:underline">
          Back to resources
        </Link>
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await update.mutateAsync({
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        visibility,
        category: category.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
      });
      router.push(`/resources/${id}`);
    } catch (err) {
      setError((err as Error).message || "Could not save changes.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit resource" description="Update the node's details." />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="visibility">Visibility</Label>
            <select
              id="visibility"
              className={selectClass}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              {RESOURCE_VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cover">Cover image URL</Label>
          <Input
            id="cover"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={update.isPending}>
            {update.isPending ? "Saving..." : "Save changes"}
          </Button>
          <Link href={`/resources/${id}`}>
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
