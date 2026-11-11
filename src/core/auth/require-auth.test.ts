// End-to-end auth: guards. requireOnboarded must auto-provision the Relnex
// User projection on first login (identity exists, no local row yet).
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import type { AuthSession } from "./get-session";

const { getSession, create } = vi.hoisted(() => ({
  getSession: vi.fn(),
  create: vi.fn(),
}));

vi.mock("./get-session", () => ({ getSession }));
vi.mock("@/core/db/prisma", () => ({ prisma: { user: { create } } }));

import { requireAuth, requireOnboarded } from "./require-auth";

const req = {} as unknown as NextRequest;

function session(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    identityId: "idn_test123",
    tenantId: null,
    scope: [],
    user: null,
    userId: undefined,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("returns the session when authenticated", async () => {
    const s = session();
    getSession.mockResolvedValue(s);
    await expect(requireAuth(req)).resolves.toBe(s);
  });

  it("throws ApiError.unauthorized when there is no session", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireAuth(req)).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  });
});

describe("requireOnboarded", () => {
  it("provisions a User when the identity has no projection row", async () => {
    getSession.mockResolvedValue(session());
    const created = { id: "usr_new", identityId: "idn_test123" };
    create.mockResolvedValue(created);

    const result = await requireOnboarded(req);

    expect(create).toHaveBeenCalledOnce();
    expect(result.user).toBe(created);
    expect(result.userId).toBe("usr_new");
  });

  it("does not provision when the User already exists", async () => {
    const existingUser = { id: "usr_1", identityId: "idn_test123" };
    getSession.mockResolvedValue(
      session({ user: existingUser as never, userId: "usr_1" })
    );

    const result = await requireOnboarded(req);

    expect(create).not.toHaveBeenCalled();
    expect(result.userId).toBe("usr_1");
  });

  it("still requires authentication first", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireOnboarded(req)).rejects.toMatchObject({ statusCode: 401 });
  });
});
