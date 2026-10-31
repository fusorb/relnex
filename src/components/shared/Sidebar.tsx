// src/components/shared/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import * as Icons from "@fusorb/facet-components/icons";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-border bg-background lg:block pt-16">
      <div className="flex h-full flex-col justify-between py-6 px-4">
        <div className="space-y-4">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Navigation Graph
          </div>
          <nav className="space-y-1">
            {siteConfig.dashboardNavItems.map((item) => {
              const IconComponent: typeof Icons.HelpCircle =
                (Icons as unknown as Record<string, typeof Icons.HelpCircle>)[item.icon] ?? Icons.HelpCircle;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <IconComponent
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-border pt-4 px-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
              U
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-medium text-foreground truncate">
                Graph Operator
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                tenant-isolated-mode
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
