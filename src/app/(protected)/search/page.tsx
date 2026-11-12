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
  EmptyState,
  Icon,
  Input,
  Skeleton,
} from "@fusorb/facet-components";
import { SEARCH_TYPES, useSearch, type SearchType } from "@/hooks/use-search";

const PAGE_SIZE = 20;

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<SearchType>("all");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useSearch(q, type, page, PAGE_SIZE);

  const searched = q.trim().length > 0;
  const resourceTotal = data?.resources.total ?? 0;
  const collectionTotal = data?.collections.total ?? 0;
  const userTotal = data?.users.total ?? 0;
  const totalResults = resourceTotal + collectionTotal + userTotal;
  const hasMore = Math.max(resourceTotal, collectionTotal, userTotal) > page * PAGE_SIZE;

  return (
    <div className="space-y-6">
      <PageHeader title="Search" description="Find resources, collections, and people." />

      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        placeholder="Search titles, descriptions, and people"
        aria-label="Search query"
        autoFocus
      />

      <div className="flex flex-wrap items-center gap-2">
        {SEARCH_TYPES.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={type === option ? "default" : "outline"}
            onClick={() => {
              setType(option);
              setPage(1);
            }}
          >
            {option}
          </Button>
        ))}
      </div>

      {!searched ? (
        <EmptyState
          icon={<Icon name="search" aria-hidden />}
          title="Search your knowledge graph"
          description="Search across published resources, public collections, and people."
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <EmptyState
          icon={<Icon name="circle-alert" aria-hidden />}
          title="Search failed"
          description="Try again in a moment."
        />
      ) : totalResults === 0 ? (
        <EmptyState
          icon={<Icon name="search-x" aria-hidden />}
          title="No matches"
          description={`Nothing matched "${q.trim()}".`}
        />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {totalResults} {totalResults === 1 ? "result" : "results"}
          </p>

          {data.resources.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resources ({resourceTotal})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.resources.items.map((resource) => (
                  <div key={resource.id} className="flex items-center gap-2 text-sm">
                    <Link
                      href={`/resources/${resource.id}`}
                      className="truncate font-medium text-foreground hover:text-primary"
                    >
                      {resource.title ?? "Untitled resource"}
                    </Link>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {resource.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {data.collections.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Collections ({collectionTotal})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.collections.items.map((collection) => (
                  <div key={collection.id} className="flex items-center gap-2 text-sm">
                    <Link
                      href={`/collections/${collection.id}`}
                      className="truncate font-medium text-foreground hover:text-primary"
                    >
                      {collection.title}
                    </Link>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {collection.visibility}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {data.users.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>People ({userTotal})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.users.items.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      {user.displayName ?? `@${user.username}`}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">@{user.username}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(page > 1 || hasMore) && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
