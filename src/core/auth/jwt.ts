import {
  jwtVerify,
  createRemoteJWKSet,
  importSPKI,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";

// The single token-verification seam for Relnex. Both the proxy and the
// session guards call verifySgToken, so swapping trust anchors touches only
// this file.
//
// Three trust anchors are supported, resolved in this order:
//   1. JWKS (RS256) - the target contract. Active when SG_JWKS_URL is set;
//      keys are fetched from SovGrant and cached by jose.
//   2. Pinned public key (RS256) - the interim asymmetric path. Active when
//      SG_JWT_PUBLIC_KEY is set; accepts an inline PEM or a path to one
//      (e.g. SovGrant's certs/public.pem). Use this until SovGrant publishes
//      the access-token signing key in its JWKS.
//   3. Shared secret (HS256) - the temporary first-party shortcut for local
//      dev / e2e when no asymmetric anchor is configured.
//
// The algorithm is pinned per anchor so a token cannot downgrade it.
//
// NOTE: SovGrant's current JWKS (/api/v1/oauth/jwks) publishes the tenant
// VC/DID signing keys, not the RSA key that signs access tokens, and access
// tokens carry no `kid`. Until that is reconciled on the SovGrant side,
// prefer SG_JWT_PUBLIC_KEY (or the shared secret) and point SG_JWKS_URL at a
// JWKS that actually contains the access-token signing key once it exists.

const issuer = () => process.env.SG_ISSUER ?? "sovgrant";

/** Resolved once; jose caches the remote key set internally. */
let remoteJwks: JWTVerifyGetKey | null = null;

function getJwks(): JWTVerifyGetKey | null {
  const url = process.env.SG_JWKS_URL;
  if (!url) return null;
  remoteJwks ??= createRemoteJWKSet(new URL(url));
  return remoteJwks;
}

/** Cached against the configured source so an env change re-imports. */
let pinnedKey: { source: string; key: CryptoKey } | null = null;

async function getPinnedKey(): Promise<CryptoKey | null> {
  const source = process.env.SG_JWT_PUBLIC_KEY;
  if (!source) return null;
  if (pinnedKey?.source === source) return pinnedKey.key;

  const pem = source.includes("-----BEGIN")
    ? source
    : (await import("node:fs")).readFileSync(source, "utf8");
  const key = await importSPKI(pem, "RS256");
  pinnedKey = { source, key };
  return key;
}

export interface SgTokenPayload extends JWTPayload {
  sub:    string;    // Sg Identity.id
  jti:    string;
  scope:  string;    // space-separated
  aud:    string[];
  tid?:   string;    // tenantId
}

/**
 * Verifies a Sg access token locally (no network call to SovGrant per request).
 * Prefers JWKS (SG_JWKS_URL), then a pinned public key (SG_JWT_PUBLIC_KEY),
 * then the shared secret (SG_JWT_SECRET). Throws jose errors on failure -
 * caught by the error boundary.
 */
export async function verifySgToken(token: string): Promise<SgTokenPayload> {
  const jwks = getJwks();
  if (jwks) {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: issuer(),
      algorithms: ["RS256"],
    });
    return payload as SgTokenPayload;
  }

  const publicKey = await getPinnedKey();
  if (publicKey) {
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: issuer(),
      algorithms: ["RS256"],
    });
    return payload as SgTokenPayload;
  }

  const secret = new TextEncoder().encode(process.env.SG_JWT_SECRET!);
  const { payload } = await jwtVerify(token, secret, {
    issuer: issuer(),
    algorithms: ["HS256"],
  });
  return payload as SgTokenPayload;
}
