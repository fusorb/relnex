"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  useAddResourceToCollection,
  useCollection,
  useDeleteCollection,
  useRemoveResourceFromCollection,
  useUpdateCollection,
} from "@/hooks/use-collections";
import { useResources } from "@/hooks/use-resources";

const selectClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring";

function EditCollectionForm({
  collectionId,
  initial,
  onDone,
}: {
  collectionId: string;
  initial: { title: string; description: string | null; visibility: string };
  onDone: () => void;
}) {
  const update = useUpdateCollection(collectionId);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [visibility, setVisibility] = useState(initial.visibility);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    setError(null);
    try {
      await update.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
      });
      onDone();
    } catch (err) {
      setError((err as Error).message || "Could not update the collection.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-collection-title">Title</Label>
        <Input
          id="edit-collection-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-collection-description">Description</Label>
        <Textarea
          id="edit-collection-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What belongs in here?"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-collection-visibility">Visibility</Label>
        <select
          id="edit-collection-visibility"
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
        <Button type="submit" size="sm" disabled={update.isPending}>
          {update.isPending ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AddResourceForm({
  collectionId,
  existingIds,
  onDone,
}: {
  collectionId: string;
  existingIds: Set<string>;
  onDone: () => void;
}) {
  const [query, setQuery] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading } = useResources({ limit: 100 });
  const add = useAddResourceToCollection(collectionId);

  const q = query.trim().toLowerCase();
  const candidates = (data?.items ?? [])
    .filter((r) => !existingIds.has(r.id))
    .filter(
      (r) => !q || (r.title ?? "").toLowerCase().includes(q) || r.type.toLowerCase().includes(q),
    )
    .slice(0, 20);

  async function handleAdd() {
    if (!resourceId) {
      setError("Pick a resource to add.");
      return;
    }
    setError(null);
    try {
      await add.mutateAsync(resourceId);
      onDone();
    } catch (err) {
      setError((err as Error).message || "Could not add the resource.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="collection-resource">Resource</Label>
        <Input
          id="collection-resource"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your resources by title or type"
        />
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
          {isLoading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Loading resources...</p>
          ) : candidates.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Nothing to add - every matching resource is already in this collection.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {candidates.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setResourceId(r.id)}
                    aria-pressed={resourceId === r.id}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                      resourceId === r.id ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <span className="truncate">{r.title ?? "Untitled resource"}</span>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {r.type}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button size="sm" onClick={handleAdd} disabled={add.isPending || !resourceId}>
          {add.isPending ? "Adding..." : "Add to collection"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function CollectionDetailPage() {
  const params = useParams<{ collectionId: string }>();
  const id = params?.collectionId ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: collection, isLoading } = useCollection(id);
  const remove = useRemoveResourceFromCollection(id);
  const del = useDeleteCollection();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!collection) {
    return (
      <EmptyState
        icon={<Icon name="search-x" aria-hidden />}
        title="Collection not found"
        description="It may have been deleted, or you do not have access to it."
        action={
          <Link href="/collections">
            <Button variant="outline" size="sm">
              Back to collections
            </Button>
          </Link>
        }
      />
    );
  }

  const existingIds = new Set(collection.resources.map((entry) => entry.resource.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title={collection.title}
        description={collection.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Icon name="pencil" className="size-4" aria-hidden /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Icon name="plus" className="size-4" aria-hidden /> Add resource
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={del.isPending}
              onClick={() =>
                del.mutate(id, { onSuccess: () => router.push("/collections") })
              }
            >
              {del.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">{collection.visibility}</Badge>
        <span>{collection.resources.length} resources</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          {collection.resources.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nothing here yet - use Add resource to build this collection.
            </p>
          ) : (
            <ol className="space-y-2">
              {collection.resources.map((entry) => (
                <li key={entry.id} className="flex items-center gap-2 text-sm">
                  <Link
                    href={`/resources/${entry.resource.id}`}
                    className="truncate font-medium text-foreground hover:text-primary"
                  >
                    {entry.resource.title ?? "Untitled resource"}
                  </Link>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {entry.resource.type}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => remove.mutate(entry.resource.id)}
                    disabled={remove.isPending}
                    className="ml-auto shrink-0 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                    aria-label={`Remove ${entry.resource.title ?? "resource"} from this collection`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a resource</DialogTitle>
            <DialogDescription>Pick a resource to append to this collection.</DialogDescription>
          </DialogHeader>
          {open && (
            <AddResourceForm
              collectionId={id}
              existingIds={existingIds}
              onDone={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit collection</DialogTitle>
            <DialogDescription>Update the title, description, or visibility.</DialogDescription>
          </DialogHeader>
          {editOpen && (
            <EditCollectionForm
              collectionId={id}
              initial={{
                title: collection.title,
                description: collection.description,
                visibility: collection.visibility,
              }}
              onDone={() => setEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
