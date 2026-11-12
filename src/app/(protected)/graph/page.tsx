"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Skeleton,
} from "@fusorb/facet-components";
import { useGraph } from "@/hooks/use-graph";
import { RELATION_TYPES } from "@/hooks/use-resource";

const W = 720;
const H = 560;
const RADIUS = 210;

const RELATION_COLORS: Record<string, string> = {
  RELATED: "var(--chart-1)",
  REFERENCES: "var(--chart-2)",
  DEPENDS_ON: "var(--chart-3)",
  PREREQUISITE: "var(--chart-4)",
  NEXT: "var(--chart-5)",
  PREVIOUS: "var(--muted-foreground)",
};

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default function GraphPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useGraph();
  const [active, setActive] = useState<string | null>(null);

  // Deterministic radial layout - dependency-free and stable across renders.
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const nodes = data?.nodes ?? [];
    nodes.forEach((node, index) => {
      const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
      map.set(node.id, {
        x: W / 2 + RADIUS * Math.cos(angle),
        y: H / 2 + RADIUS * Math.sin(angle),
      });
    });
    return map;
  }, [data]);

  const usedTypes = useMemo(() => {
    const types = new Set((data?.edges ?? []).map((edge) => edge.type));
    return RELATION_TYPES.filter((type) => types.has(type));
  }, [data]);

  function open(id: string) {
    router.push(`/resources/${id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Graph view"
        description="Your published resources and the typed relations between them."
      />

      {isLoading ? (
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      ) : isError ? (
        <EmptyState
          icon={<Icon name="circle-alert" aria-hidden />}
          title="We couldn't load your graph"
          description="Refresh the page and try again."
        />
      ) : !data || data.nodes.length === 0 ? (
        <EmptyState
          icon={<Icon name="share2" aria-hidden />}
          title="Your graph is empty"
          description="Publish a resource and connect it to another to see the network here."
          action={
            <Link href="/resources/new">
              <Button size="sm">Create a resource</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>{data.nodes.length} nodes</span>
            <span aria-hidden>·</span>
            <span>{data.edges.length} relations</span>
            {usedTypes.length > 0 && (
              <span className="flex flex-wrap items-center gap-3">
                {usedTypes.map((type) => (
                  <span key={type} className="inline-flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: RELATION_COLORS[type] }}
                      aria-hidden
                    />
                    {type}
                  </span>
                ))}
              </span>
            )}
          </div>

          <Card>
            <CardContent className="p-2">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                role="img"
                aria-label="Knowledge graph of your resources and their relations"
              >
                {data.edges.map((edge, index) => {
                  const from = positions.get(edge.fromId);
                  const to = positions.get(edge.toId);
                  if (!from || !to) return null;
                  const highlighted = active === edge.fromId || active === edge.toId;
                  return (
                    <line
                      key={`${edge.fromId}-${edge.toId}-${edge.type}-${index}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={RELATION_COLORS[edge.type] ?? "var(--border)"}
                      strokeWidth={highlighted ? 2.5 : 1.2}
                      opacity={active && !highlighted ? 0.12 : 0.7}
                    />
                  );
                })}
                {data.nodes.map((node) => {
                  const point = positions.get(node.id);
                  if (!point) return null;
                  const highlighted = active === node.id;
                  return (
                    <g
                      key={node.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer outline-none"
                      onMouseEnter={() => setActive(node.id)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(node.id)}
                      onBlur={() => setActive(null)}
                      onClick={() => open(node.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          open(node.id);
                        }
                      }}
                    >
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={highlighted ? 13 : 9}
                        fill="var(--primary)"
                        stroke="var(--background)"
                        strokeWidth={2}
                      />
                      <text
                        x={point.x}
                        y={point.y - 16}
                        textAnchor="middle"
                        fontSize={11}
                        fill="var(--foreground)"
                      >
                        {truncate(node.title ?? "Untitled resource", 22)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relations</CardTitle>
            </CardHeader>
            <CardContent>
              {data.edges.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No relations yet - open a resource and use Connect to link it to another.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.edges.map((edge, index) => {
                    const from = data.nodes.find((node) => node.id === edge.fromId);
                    const to = data.nodes.find((node) => node.id === edge.toId);
                    return (
                      <li
                        key={`${edge.fromId}-${edge.toId}-${edge.type}-${index}`}
                        className="flex flex-wrap items-center gap-2 text-sm"
                      >
                        <Link
                          href={`/resources/${edge.fromId}`}
                          className="truncate font-medium text-foreground hover:text-primary"
                        >
                          {from?.title ?? "Untitled resource"}
                        </Link>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {edge.type}
                        </Badge>
                        <Link
                          href={`/resources/${edge.toId}`}
                          className="truncate font-medium text-foreground hover:text-primary"
                        >
                          {to?.title ?? "Untitled resource"}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
