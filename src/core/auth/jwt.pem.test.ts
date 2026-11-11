// Auth: pinned public-key (RS256) verification path.
//
// Covers both accepted forms of SG_JWT_PUBLIC_KEY - an inline PEM and a
// filesystem path - using a real jose keypair (no SovGrant, no shared secret).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateKeyPair, exportSPKI, SignJWT } from "jose";
import { verifySgToken } from "@/core/auth/jwt";

type PrivateKey = Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];

const ISSUER = "sovgrant";

let privateKey: PrivateKey;
let otherPrivateKey: PrivateKey;
let pem: string;
let pemPath: string;
let tmpDir: string;

beforeAll(async () => {
  delete process.env.SG_JWKS_URL; // force the pinned-key anchor
  process.env.SG_ISSUER = ISSUER;

  const kp = await generateKeyPair("RS256");
  privateKey = kp.privateKey;
  otherPrivateKey = (await generateKeyPair("RS256")).privateKey;
  pem = await exportSPKI(kp.publicKey);

  tmpDir = mkdtempSync(join(tmpdir(), "relnex-pem-"));
  pemPath = join(tmpDir, "public.pem");
  writeFileSync(pemPath, pem);

  process.env.SG_JWT_PUBLIC_KEY = pem;
});

afterAll(() => {
  delete process.env.SG_JWT_PUBLIC_KEY;
  rmSync(tmpDir, { recursive: true, force: true });
});

function sign(key: PrivateKey) {
  return new SignJWT({ scope: "read" })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(ISSUER)
    .setSubject("idn_test")
    .setJti("jti_test")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}

describe("verifySgToken via pinned public key", () => {
  it("verifies a token against an inline PEM", async () => {
    process.env.SG_JWT_PUBLIC_KEY = pem;
    const payload = await verifySgToken(await sign(privateKey));
    expect(payload.sub).toBe("idn_test");
  });

  it("verifies a token against a PEM file path", async () => {
    process.env.SG_JWT_PUBLIC_KEY = pemPath;
    const payload = await verifySgToken(await sign(privateKey));
    expect(payload.jti).toBe("jti_test");
  });

  it("rejects a token signed by a different key", async () => {
    process.env.SG_JWT_PUBLIC_KEY = pem;
    await expect(verifySgToken(await sign(otherPrivateKey))).rejects.toThrow();
  });
});
