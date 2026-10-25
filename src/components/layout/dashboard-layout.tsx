"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { ICON_REGISTRY } from "@/lib/useful/utils/icon-registry";
import { useAuth } from "@/hooks/use-auth";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const LogoutIcon = ICON_REGISTRY.logout;
  const SettingsIcon = ICON_REGISTRY.settings;
  const HelpIcon = ICON_REGISTRY.help;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Fixed Sidebar Navigation Panel Container */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight"
          >
            <div className="h-7 w-7 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-black text-sm">
              R
            </div>
            {siteConfig.name}{" "}
            <span className="text-xs text-muted-foreground font-normal px-1.5 py-0.5 rounded bg-muted border border-border">
              Core
            </span>
          </Link>
        </div>

        {/* Action Link Clusters */}
        <nav className="flex-1 p-4 space-y-1">
          {siteConfig.dashboardNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Identity Footer Controls */}
        <div className="p-4 border-t border-border bg-muted/20 space-y-2">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary uppercase">
                {user.username.slice(0, 2)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate text-foreground">
                  {user.displayName || user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogoutIcon className="h-4 w-4" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Panel Dynamic Scrolling Space Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm md:justify-end">
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="System Settings"
            >
              <SettingsIcon className="h-5 w-5" />
            </Link>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground bg-muted border px-2 py-1 rounded-md">
              Onboarding Complete
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  );
}
