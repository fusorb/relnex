"use client";

// Session hook for the console shell. Interim: reads Relnex's own /api/auth/me
// (the BFF httpOnly-cookie flow). Returns the facet-layout LayoutSession shape
// so it can be injected into ConsoleLayout. Swapping this for facet-auth's
// SgProvider/useAuthSession is a later slice (frontend plan §5).
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LayoutSession } from "@fusorb/facet-layout";
import { apiClient } from "@/lib/useful/api-client";

interface MeResponse {
  success: boolean;
  data: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    onboardingStep?: number;
    requiresOnboarding?: boolean;
  };
}

export function useSession(): LayoutSession {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<MeResponse["data"] | null> => {
      try {
        return (await apiClient<MeResponse>("/api/auth/me")).data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const signOut = async () => {
    await apiClient("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    await queryClient.invalidateQueries({ queryKey: ["session"] });
  };

  return {
    user: data
      ? {
          name: data.displayName ?? data.username,
          email: null, // identity-owned; not stored in Relnex's projection
          picture: data.avatarUrl,
        }
      : null,
    isAuthenticated: Boolean(data),
    isLoading,
    signOut,
  };
}
