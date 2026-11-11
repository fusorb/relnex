"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@fusorb/facet-components";
import { apiClient } from "@/lib/useful/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiClient("/api/auth/register", { method: "POST", bodyData: form });
      router.push("/onboarding");
    } catch (err) {
      setError((err as Error).message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Create account</h1>
        <p className="text-sm text-muted-foreground">Sign up to start building your knowledge graph.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            required
            placeholder="john_doe"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-foreground underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
