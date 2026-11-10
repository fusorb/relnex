// src/app/(auth)/login/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/useful/api-client";
import { Button } from "@fusorb/facet-components";
import { Input } from "@fusorb/facet-components";
import { Label } from "@fusorb/facet-components";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient<{
        success: boolean;
        data: {
          user?: { onboardingStep?: number };
          accessToken: string;
          refreshToken: string;
          requiresMfa: boolean;
          sessionId?: string;
        };
      }>("/api/auth/login", { method: "POST", bodyData: formData });

      if (res.data.requiresMfa) {
        router.push(`/auth/mfa?sessionId=${res.data.sessionId}`);
        return;
      }

      if (res.data.user?.onboardingStep !== undefined && res.data.user.onboardingStep < 3) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Column: Splash */}
      <div className="hidden lg:flex bg-neutral-950 flex-col justify-between p-12 relative text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [bg-size:20px_20px]" />
        <Link href="/" className="text-xl font-black tracking-tight z-10">
          Relnex.
        </Link>
        <div className="max-w-md z-10 space-y-4">
          <blockquote className="text-xl font-medium tracking-tight text-neutral-300">
            &ldquo;The direct connection between structural node records and spatial
            knowledge graph telemetry changed our global partition efficiency
            metrics entirely.&rdquo;
          </blockquote>
          <div>
            <p className="text-sm font-bold">Dr. Evelyn Vance</p>
            <p className="text-xs text-neutral-500">
              Principal Graph Modeler, NeuraLink Systems
            </p>
          </div>
        </div>
        <p className="text-xs text-neutral-600 z-10">
          Protected Tenant Architecture V0.1.0
        </p>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">Login</h1>
            <p className="text-xs text-muted-foreground">
              Enter your email and password to access your workspace.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                className="text-xs"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                className="text-xs"
                value={formData.password}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, password: e.target.value }))
                }
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full font-bold text-xs"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold underline text-foreground"
            >
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
