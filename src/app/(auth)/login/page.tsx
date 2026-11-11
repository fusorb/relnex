"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@fusorb/facet-auth";
import { apiClient } from "@/lib/useful/api-client";

interface LoginResponse {
  success: boolean;
  data: {
    requiresMfa: boolean;
    sessionId?: string;
    user?: { onboardingStep?: number };
  };
}

export default function LoginPage() {
  const router = useRouter();

  return (
    <LoginForm
      validate
      onSubmit={async (email, password) => {
        try {
          const res = await apiClient<LoginResponse>("/api/auth/login", {
            method: "POST",
            bodyData: { email, password },
          });

          if (res.data.requiresMfa) {
            return "Multi-factor authentication is required for this account.";
          }

          const step = res.data.user?.onboardingStep ?? 0;
          router.push(step < 3 ? "/onboarding" : "/dashboard");
          return null;
        } catch (err) {
          return (err as Error).message || "Login failed. Please try again.";
        }
      }}
    />
  );
}
