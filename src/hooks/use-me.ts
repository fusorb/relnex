"use client";

// Canonical session/profile query. Single source of truth for "who am I" in the
// browser; /api/auth/me returns either the full PrivateUser or a
// { requiresOnboarding: true } marker for an authenticated identity that has no
// Relnex User record yet (see app/api/auth/me/route.ts).
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/useful/api-client";

export interface MeUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  archetype: string;
  /** Identity-owned: always null in Relnex's projection today. */
  email: string | null;
  identityId: string;
  role: string;
  onboardingStep: number;
  preferences: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequiresOnboarding {
  requiresOnboarding: true;
}

export type MeData = MeUser | RequiresOnboarding;

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const ME_QUERY_KEY = ["me"] as const;

export function requiresOnboarding(data: MeData | null | undefined): data is RequiresOnboarding {
  return Boolean(data && (data as RequiresOnboarding).requiresOnboarding === true);
}

export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async (): Promise<MeData | null> => {
      try {
        return (await apiClient<ApiEnvelope<MeData>>("/api/auth/me")).data;
      } catch {
        return null;
      }
    },
    retry: false,
  });
}
