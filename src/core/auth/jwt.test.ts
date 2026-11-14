// End-to-end auth: token verification seam (verifySgToken).
//
// Uses real `jose` sign/verify round-trips rather than mocking, so the test
// exercises the actual issuer check and signature validation.
import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { verifySgToken } from "@/core/auth/jwt";

const SECRET = "test-jwt-secret";
const ISSUER = "sg";
const bytes = (s: string) => new TextEncoder().encode(s);

function sign(
  claims: Record<string, unknown> = {},
  opts: { issuer?: string; secret?: string; expiresIn?: string | number } = {}
) {
  return new SignJWT({ token_use: "access", ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(opts.issuer ?? ISSUER)
    .setSubject("idn_test123")
    .setIssuedAt()
    .setJti("jti_test")
    .setExpirationTime(opts.expiresIn ?? "5m")
    .sign(bytes(opts.secret ?? SECRET));
}

beforeAll(() => {
  process.env.SG_JWT_SECRET = SECRET;
  process.env.SG_ISSUER = ISSUER;
});

describe("verifySgToken", () => {
  it("verifies a valid token and returns its claims", async () => {
    const token = await sign({ scope: "read write", aud: ["relnex"], tid: "tenant_a" });
    const payload = await verifySgToken(token);

    expect(payload.sub).toBe("idn_test123");
    expect(payload.jti).toBe("jti_test");
    expect(payload.scope).toBe("read write");
    expect(payload.tid).toBe("tenant_a");
  });

  it("rejects a token signed with the wrong secret", async () => {
    const token = await sign({}, { secret: "not-the-secret" });
    await expect(verifySgToken(token)).rejects.toThrow();
  });

  it("rejects a token with an unexpected issuer", async () => {
    const token = await sign({}, { issuer: "someone-else" });
    await expect(verifySgToken(token)).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const token = await sign({}, { expiresIn: Math.floor(Date.now() / 1000) - 60 });
    await expect(verifySgToken(token)).rejects.toThrow();
  });

  it("rejects a malformed token", async () => {
    await expect(verifySgToken("not.a.jwt")).rejects.toThrow();
  });

  it("rejects an ID token presented as a bearer token", async () => {
    // An ID token is signed with the same key; only token_use: "access" may
    // be used as a bearer credential.
    const idToken = await sign({ token_use: "id", aud: "relnex" });
    await expect(verifySgToken(idToken)).rejects.toThrow(/token type/i);
  });

  it("rejects a token with no token_use marker", async () => {
    const unmarked = await sign({ token_use: undefined });
    await expect(verifySgToken(unmarked)).rejects.toThrow(/token type/i);
  });
});
