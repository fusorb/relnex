// Proxy (formerly middleware): gating + tenant/identity header forwarding.
// Exercises the exported `proxy` function directly with NextRequest doubles.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { verifySgToken } = vi.hoisted(() => ({ verifySgToken: vi.fn() }));
vi.mock("@/core/auth/jwt", () => ({ verifySgToken }));

import { proxy } from "@/proxy";

function req(
  path: string,
  opts: { cookie?: string; authorization?: string; headers?: Record<string, string> } = {}
): NextRequest {
  const headers = new Headers(opts.headers);
  if (opts.cookie) headers.set("cookie", `sg_at=${opts.cookie}`);
  if (opts.authorization) headers.set("authorization", opts.authorization);
  return new NextRequest(`https://relnex.test${path}`, { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxy", () => {
  it("redirects an unauthenticated request to /login with a ?next hint", async () => {
    const res = await proxy(req("/dashboard"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/dashboard");
    expect(verifySgToken).not.toHaveBeenCalled();
  });

  it("allows an authenticated request and forwards tenant/identity headers", async () => {
    verifySgToken.mockResolvedValue({ sub: "idn_test", tid: "tenant_a" });
    const res = await proxy(req("/dashboard", { cookie: "valid.token" }));
    expect(res.headers.get("x-middleware-request-x-tenant-id")).toBe("tenant_a");
    expect(res.headers.get("x-middleware-request-x-identity-id")).toBe("idn_test");
  });

  it("reads the bearer token from the Authorization header", async () => {
    verifySgToken.mockResolvedValue({ sub: "idn_test", tid: "tenant_a" });
    await proxy(req("/dashboard", { authorization: "Bearer str.token" }));
    expect(verifySgToken).toHaveBeenCalledWith("str.token");
  });

  it("treats an invalid token as unauthenticated on a protected page", async () => {
    verifySgToken.mockRejectedValue(new Error("expired"));
    const res = await proxy(req("/settings", { cookie: "bad.token" }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("passes unauthenticated public pages through without a token", async () => {
    const res = await proxy(req("/"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not forward identity headers for an anonymous public request", async () => {
    const res = await proxy(req("/"));
    expect(res.headers.get("x-middleware-request-x-identity-id")).toBeNull();
  });

  it("ignores a client-supplied x-tenant-id (anti-spoof)", async () => {
    const res = await proxy(req("/", { headers: { "x-tenant-id": "attacker-tenant" } }));
    expect(res.headers.get("x-middleware-request-x-tenant-id")).toBe("relnex-default");
  });

  it("emits the default tenant when the verified token carries no tid", async () => {
    verifySgToken.mockResolvedValue({ sub: "idn_test" });
    const res = await proxy(req("/dashboard", { cookie: "valid.token" }));
    expect(res.headers.get("x-middleware-request-x-tenant-id")).toBe("relnex-default");
  });
});
