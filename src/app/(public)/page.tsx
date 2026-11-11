import Link from "next/link";
import { LandingLayout } from "@fusorb/facet-layout";
import { Button } from "@fusorb/facet-components";
import { siteConfig, landingNav } from "@/config/layout";

function LandingNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-black tracking-tight text-foreground">
          {siteConfig.name}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {landingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function LandingPage() {
  const hero = (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center">
      <h1 className="text-balance text-5xl font-black tracking-tight text-foreground sm:text-6xl">
        {siteConfig.name}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
        {siteConfig.description}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/register">
          <Button size="lg">Start building</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline">
            Sign in
          </Button>
        </Link>
      </div>
    </section>
  );

  const footer = (
    <footer className="border-t border-border py-8">
      <p className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}. {siteConfig.tagline}
      </p>
    </footer>
  );

  return (
    <LandingLayout hero={hero} nav={<LandingNav />} footer={footer}>
      <section id="features" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Connected knowledge",
              body: "Resources are nodes; typed relations link them into a navigable graph.",
            },
            {
              title: "Curation, not dumping",
              body: "Collections, hierarchy, and tags keep scattered material organized.",
            },
            {
              title: "Discovery",
              body: "Search and walk the graph to find what relates, not just what matches.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-bold text-foreground">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </LandingLayout>
  );
}
