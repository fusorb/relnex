"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@fusorb/facet-layout";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Icon,
  Input,
  Label,
  Skeleton,
  Textarea,
} from "@fusorb/facet-components";
import {
  COLLECTION_VISIBILITIES,
  slugify,
  useCollections,
  useCreateCollection,
} from "@/hooks/use-collections";

const selectClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring";

function CreateCollectionForm({ onDone }: { onDone: () => void }) {
  const create = useCreateCollection();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<string>("PUBLIC");
  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = slugTouched ? slug : slugify(title);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !effectiveSlug) {
      setError("A title is required.");
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({
        title: title.trim(),
        slug: effectiveSlug,
        description: description.trim() || undefined,
        visibility,
      });
      onDone();
    } catch (err) {
      setError((err as Error).message || "Could not create the collection.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="collection-title">Title</Label>
        <Input
          id="collection-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Reading list"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="collection-slug">Slug</Label>
        <Input
          id="collection-slug"
          value={effectiveSlug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          placeholder="reading-list"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="collection-description">Description</Label>
        <Textarea
          id="collection-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What belongs in here?"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="collection-visibility">Visibility</Label>
        <select
          id="collection-visibility"
          className={selectClass}
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          {COLLECTION_VISIBILITIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" size="sm" disabled={create.isPending}>
          {create.isPending ? "Creating..." : "Create collection"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function CollectionsPage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useCollections(1, 50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description="Ordered groupings of resources."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Icon name="plus" className="size-4" aria-hidden /> New collection
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Icon name="circle-alert" aria-hidden />}
          title="We couldn't load your collections"
          description="Refresh the page and try again."
        />
      ) : data && data.items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}`} className="group block">
              <Card className="h-full transition-colors group-hover:border-primary/60">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-sm">{collection.title}</CardTitle>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {collection.visibility}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {collection.resourceCount}{" "}
                    {collection.resourceCount === 1 ? "resource" : "resources"}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {collection.description ?? "No description yet."}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Icon name="layers" aria-hidden />}
          title="No collections yet"
          description="Group related resources into an ordered set."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Create a collection
            </Button>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <DialogDescription>Group resources into an ordered set.</DialogDescription>
          </DialogHeader>
          {open && <CreateCollectionForm onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
