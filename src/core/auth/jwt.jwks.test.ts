// Auth: JWKS/RS256 verification path (the target trust anchor).
//
// Serves a local JWKS over HTTP and exercises the real createRemoteJWKSet
// path - no SovGrant or shared secret involved.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { verifySgToken } from "@/core/auth/jwt";

type PrivateKey = Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];

const ISSUER = "sovgrant";
const KID = "test-rsa-key";

let server: Server;
let privateKey: PrivateKey;
let otherPrivateKey: PrivateKey;

beforeAll(async () => {
  const kp = await generateKeyPair("RS256");
  privateKey = kp.privateKey;
  otherPrivateKey = (await generateKeyPair("RS256")).privateKey;

  const publicJwk = {
    ...(await exportJWK(kp.publicKey)),
    kid: KID,
    alg: "RS256",
    use: "sig",
  };

  server = createServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ keys: [publicJwk] }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  process.env.SG_JWKS_URL = `http://127.0.0.1:${port}/jwks`;
  process.env.SG_ISSUER = ISSUER;
});

afterAll(() => {
  delete process.env.SG_JWKS_URL;
  server.close();
});

function sign(key: PrivateKey) {
  return new SignJWT({ scope: "read", token_use: "access" })
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setIssuer(ISSUER)
    .setSubject("idn_test")
    .setJti("jti_test")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}

describe("verifySgToken via JWKS", () => {
  it("verifies a token signed by a key published in the JWKS", async () => {
    const payload = await verifySgToken(await sign(privateKey));
    expect(payload.sub).toBe("idn_test");
    expect(payload.jti).toBe("jti_test");
  });

  it("rejects a token signed by a key absent from the JWKS", async () => {
    await expect(verifySgToken(await sign(otherPrivateKey))).rejects.toThrow();
  });
});
