"use client";

// Root client providers for Relnex, rebuilt on @fusorb/facet-*.
// Order: theme -> React Query -> Toaster. Auth state comes from the Relnex BFF
// today (see hooks/use-session.ts); the facet-auth SgProvider swap is a later
// slice of the frontend plan.
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, Toaster } from "@fusorb/facet-components";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
