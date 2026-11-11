// End-to-end auth: getSession token resolution + User projection lookup.
//
// Prisma (real DB) and the token seam are mocked; everything else in the
// session path is the real implementation.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { findUnique, verifySgToken, getAccessTokenFromCookie } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  verifySgToken: vi.fn(),
  getAccessTokenFromCookie: vi.fn(),
}));

vi.mock("@/core/db/prisma", () => ({
  prisma: { user: { findUnique } },
}));
vi.mock("./jwt", () => ({ verifySgToken }));
vi.mock("./auth-cookie", () => ({ getAccessTokenFromCookie }));

import { getSession } from "./get-session";

// Minimal NextRequest double - getSession only reads headers + the cookie seam.
function req(headers: Record<string, string> = {}): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

const USER = { id: "usr_1", identityId: "idn_test123" };

beforeEach(() => {
  vi.clearAllMocks();
  getAccessTokenFromCookie.mockResolvedValue(null);
  findUnique.mockResolvedValue(USER);
});

describe("getSession", () => {
  it("returns null when no token is present", async () => {
    const session = await getSession(req());
    expect(session).toBeNull();
    expect(verifySgToken).not.toHaveBeenCalled();
  });

  it("resolves a session from the Authorization bearer header", async () => {
    verifySgToken.mockResolvedValue({
      sub: "idn_test123",
      scope: "read write",
      tid: "tenant_a",
    });

    const session = await getSession(req({ authorization: "Bearer good.token.here" }));

    expect(verifySgToken).toHaveBeenCalledWith("good.token.here");
    expect(session).toMatchObject({
      identityId: "idn_test123",
      tenantId: "tenant_a",
      scope: ["read", "write"],
      user: USER,
      userId: "usr_1",
    });
  });

  it("falls back to the sg_at cookie when there is no header", async () => {
    getAccessTokenFromCookie.mockResolvedValue("cookie.token");
    verifySgToken.mockResolvedValue({ sub: "idn_test123", scope: "" });

    const session = await getSession(req());

    expect(getAccessTokenFromCookie).toHaveBeenCalled();
    expect(verifySgToken).toHaveBeenCalledWith("cookie.token");
    expect(session?.scope).toEqual([]);
    expect(session?.tenantId).toBeNull();
  });

  it("returns null when the token fails verification", async () => {
    verifySgToken.mockRejectedValue(new Error("bad signature"));
    const session = await getSession(req({ authorization: "Bearer bad" }));
    expect(session).toBeNull();
  });

  it("returns a session with a null user when no projection row exists yet", async () => {
    findUnique.mockResolvedValue(null);
    verifySgToken.mockResolvedValue({ sub: "idn_new", scope: "read" });

    const session = await getSession(req({ authorization: "Bearer t" }));

    expect(session?.user).toBeNull();
    expect(session?.userId).toBeUndefined();
    expect(session?.identityId).toBe("idn_new");
  });
});
