// src/components/shared/Navbar.tsx
"use client";

import Link from "next/link";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@fusorb/facet-components";
import { cn } from "@/lib/utils";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-black tracking-tight text-foreground">
              RELNEX.
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {siteConfig.mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost" }), "text-sm")}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "default" }),
              "text-sm font-semibold",
            )}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
