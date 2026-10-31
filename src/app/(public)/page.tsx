// src/app/(public)/page.tsx
// Public landing page. Phase 6 will rebuild this with facet-components.
import Link from "next/link";
import { Button } from "@fusorb/facet-components";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="max-w-2xl text-4xl font-black tracking-tight text-foreground">
        Relnex
      </h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        The knowledge-graph content engine for the Fusorb ecosystem. Create,
        organize, and discover resources connected by typed relations.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link href="/login">
          <Button className="font-bold text-xs">Sign in</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline" className="font-bold text-xs">
            Get started
          </Button>
        </Link>
      </div>
    </main>
  );
}