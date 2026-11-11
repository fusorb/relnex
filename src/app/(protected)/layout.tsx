"use client";

import { ConsoleLayout } from "@fusorb/facet-layout";
import { consoleLayoutConfig } from "@/config/layout";
import { useRouterAdapter } from "@/components/layout/router-adapter";
import { useSession } from "@/hooks/use-session";

export default function ConsoleGroupLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouterAdapter();

  return (
    <ConsoleLayout
      config={consoleLayoutConfig}
      router={router}
      session={session}
      themeToggle
    >
      {children}
    </ConsoleLayout>
  );
}
