"use client";

// Session hook for the console shell. Derives a facet-layout LayoutSession from
// the canonical /api/auth/me query (useMe). Today auth state rides the Relnex
// BFF httpOnly-cookie flow; swapping to facet-auth's SgProvider/useAuthSession
// is a later slice (frontend plan §5).
import { useQueryClient } from "@tanstack/react-query";
import type { LayoutSession } from "@fusorb/facet-layout";
import { apiClient } from "@/lib/useful/api-client";
import { ME_QUERY_KEY, requiresOnboarding, useMe } from "./use-me";

export function useSession(): LayoutSession {
  const queryClient = useQueryClient();
  const { data, isLoading } = useMe();
  const user = data && !requiresOnboarding(data) ? data : null;

  const signOut = async () => {
    await apiClient("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
  };

  return {
    user: user
      ? {
          name: user.displayName ?? user.username,
          email: user.email, // identity-owned; null until SG userinfo is wired
          picture: user.avatarUrl,
        }
      : null,
    isAuthenticated: Boolean(data),
    isLoading,
    signOut,
  };
}
