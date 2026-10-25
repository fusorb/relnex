// src/components/home/Hero.tsx
import Link from "next/link";
import { buttonVariants } from "@fusorb/facet-components";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-20 lg:py-32 border-b border-border/50">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative text-center">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 mb-6 animate-fade-in">
          Next.js 15 & Prisma Engine Graph Architecture Connected
        </span>
        <h1 className="mx-auto max-w-4xl font-black tracking-tight text-4xl sm:text-6xl lg:text-7xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent leading-[1.1]">
          Decoupled Multi-Tenant Enterprise Knowledge Engine.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Incorporate hierarchical node data, configure complex directed acyclic
          graphs (DAG), track telemetry metrics, and handle isolated tenants
          instantly.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full sm:w-auto text-sm font-bold shadow-md shadow-primary/10",
            )}
          >
            Initialize Cluster Root
          </Link>
          <Link
            href="#features"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto text-sm font-semibold",
            )}
          >
            Explore Schema Topology
          </Link>
        </div>
      </div>
    </section>
  );
}
