import Link from "next/link";
import { PageHeader } from "@fusorb/facet-layout";
import { Button, EmptyState, Icon } from "@fusorb/facet-components";

/**
 * Placeholder for console surfaces that land in a later frontend phase
 * (resources, collections, graph, tags, settings). Keeps the sidebar navigable
 * without 404s while real pages are built graph-first.
 */
export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Icon name="hammer" aria-hidden />}
        title={`${title} lands in ${phase}`}
        description="This surface is scheduled in the frontend rebuild plan. The API it will consume is already built."
        action={
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Back to overview
            </Button>
          </Link>
        }
      />
    </div>
  );
}
