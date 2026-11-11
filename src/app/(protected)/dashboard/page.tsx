import Link from "next/link";
import { PageHeader } from "@fusorb/facet-layout";
import { Button } from "@fusorb/facet-components";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Your workspace. Recent resources, collections, and graph activity land here."
        actions={
          <Link href="/resources/new">
            <Button size="sm">New resource</Button>
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { title: "Resources", body: "Nodes you have created or curated." },
          { title: "Collections", body: "Ordered, nested groupings of resources." },
          { title: "Relations", body: "Typed edges connecting resources into a graph." },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-base font-bold text-foreground">{card.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        The dashboard surfaces are built out in the next frontend phases (resources, graph,
        collections, search).
      </p>
    </div>
  );
}
