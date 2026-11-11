"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@fusorb/facet-layout";
import { Button, Icon, Input, Label, Textarea } from "@fusorb/facet-components";
import { FileUpload } from "@/components/resources/file-upload";
import { RESOURCE_TYPES, RESOURCE_VISIBILITIES } from "@/hooks/use-resources";
import { useCreateResource } from "@/hooks/use-resource";

const selectClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring";

export default function NewResourcePage() {
  const router = useRouter();
  const create = useCreateResource();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [type, setType] = useState<string>("NOTE");
  const [visibility, setVisibility] = useState<string>("PUBLIC");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const resource = await create.mutateAsync({
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        type,
        visibility,
        category: category.trim() || undefined,
        fileUrl: fileUrl ?? undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      router.push(`/resources/${resource.id}`);
    } catch (err) {
      setError((err as Error).message || "Could not create the resource.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New resource"
        description="Create a node. Connect it to others with relations next."
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled resource" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <select id="type" className={selectClass} value={type} onChange={(e) => setType(e.target.value)}>
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
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
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="One line shown in listings"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this resource, and how does it connect?"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="optional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma, separated"
            />
          </div>
        </div>

        <FileUpload label="Attach a file (optional)" value={fileUrl} onChange={setFileUrl} />

        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create resource"}
          </Button>
          <Link href="/resources">
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
