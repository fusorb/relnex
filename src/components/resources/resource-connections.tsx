"use client";

// Authoring surface for a resource's typed relations. Owners can create
// relations (connect) and remove outgoing ones; everyone sees the read-only
// neighbourhood. Backed by POST/DELETE /api/resources/[resourceId]/relations.
import { useMemo, useState } from "react";
import Link from "next/link";
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
  Icon,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fusorb/facet-components";
import {
  RELATION_TYPES,
  useConnectResource,
  useDisconnectResource,
  type RelationEdge,
} from "@/hooks/use-resource";
import { useResources } from "@/hooks/use-resources";

function EdgeRow({
  edge,
  onRemove,
  removing,
}: {
  edge: RelationEdge;
  onRemove?: (edge: RelationEdge) => void;
  removing?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Badge variant="outline" className="shrink-0 text-[10px]">
        {edge.type}
      </Badge>
      <Link
        href={`/resources/${edge.resource.id}`}
        className="truncate font-medium text-foreground hover:text-primary"
      >
        {edge.resource.title ?? "Untitled resource"}
      </Link>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(edge)}
          disabled={removing}
          className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          aria-label={`Remove ${edge.type} relation to ${edge.resource.title ?? "untitled resource"}`}
        >
          <Icon name="unlink" className="size-3.5" aria-hidden />
          Remove
        </button>
      )}
    </li>
  );
}

function ConnectForm({
  resourceId,
  existing,
  onDone,
}: {
  resourceId: string;
  existing: RelationEdge[];
  onDone: () => void;
}) {
  const [type, setType] = useState<string>("RELATED");
  const [query, setQuery] = useState("");
  const [targetId, setTargetId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useResources({ limit: 100 });
  const connect = useConnectResource(resourceId);

  // A pair may hold several types at once (the DB key is from/to/type), so only
  // the exact type being added is treated as taken.
  const taken = useMemo(
    () => new Set(existing.filter((e) => e.type === type).map((e) => e.resource.id)),
    [existing, type],
  );

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.items ?? [])
      .filter((r) => r.id !== resourceId && !taken.has(r.id))
      .filter(
        (r) =>
          !q ||
          (r.title ?? "").toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [data, query, resourceId, taken]);

  async function handleConnect() {
    if (!targetId) {
      setError("Pick a resource to connect to.");
      return;
    }
    setError(null);
    try {
      await connect.mutateAsync({ targetId, type });
      onDone();
    } catch (err) {
      setError((err as Error).message || "Could not create the relation.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="relation-type">Relation type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="relation-type">
            <SelectValue placeholder="Pick a type" />
          </SelectTrigger>
          <SelectContent>
            {RELATION_TYPES.map((relationType) => (
              <SelectItem key={relationType} value={relationType}>
                {relationType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="relation-target">Target resource</Label>
        <Input
          id="relation-target"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your resources by title or type"
        />
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
          {isLoading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Loading resources...</p>
          ) : candidates.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No matching resources - adjust the search or the relation type.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {candidates.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setTargetId(r.id)}
                    aria-pressed={targetId === r.id}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                      targetId === r.id ? "bg-muted text-foreground" : "text-muted-foreground"
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
        <Button size="sm" onClick={handleConnect} disabled={connect.isPending || !targetId}>
          {connect.isPending ? "Connecting..." : "Create relation"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function ResourceConnections({
  resourceId,
  canEdit,
  outgoing,
  incoming,
}: {
  resourceId: string;
  canEdit: boolean;
  outgoing: RelationEdge[];
  incoming: RelationEdge[];
}) {
  const [open, setOpen] = useState(false);
  const disconnect = useDisconnectResource(resourceId);

  // Read-only visitors only see the card when there is something to show.
  if (!canEdit && outgoing.length === 0 && incoming.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Connections</CardTitle>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Icon name="link" className="size-4" aria-hidden /> Connect
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            References
          </p>
          {outgoing.length === 0 ? (
            <p className="text-xs text-muted-foreground">No outgoing relations yet.</p>
          ) : (
            <ul className="space-y-2">
              {outgoing.map((edge) => (
                <EdgeRow
                  key={edge.id}
                  edge={edge}
                  removing={disconnect.isPending}
                  onRemove={canEdit ? (e) => disconnect.mutate({ targetId: e.resource.id, type: e.type }) : undefined}
                />
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Referenced by
          </p>
          {incoming.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing references this yet.</p>
          ) : (
            <ul className="space-y-2">
              {incoming.map((edge) => (
                <EdgeRow key={edge.id} edge={edge} />
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect this resource</DialogTitle>
            <DialogDescription>
              Add a typed relation to another resource in your workspace.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <ConnectForm resourceId={resourceId} existing={outgoing} onDone={() => setOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
