import {
  jwtVerify,
  createRemoteJWKSet,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";

// The single token-verification seam for Relnex. Both the proxy and the
// session guards call verifySgToken, so swapping trust anchors touches only
// this file.
//
// Two trust anchors are supported:
//   1. JWKS (RS256) - the target contract. Active when SG_JWKS_URL is set;
//      keys are fetched from SovGrant and cached by jose. Pin RS256 so a
//      token cannot downgrade the algorithm.
//   2. Shared secret (HS256) - the temporary first-party shortcut used for
//      local dev / e2e until SovGrant is stable and publishes the
//      access-token signing key in its JWKS. See docs/identity-model.md.
//
// NOTE: SovGrant's current JWKS (/api/v1/oauth/jwks) publishes the tenant
// VC/DID signing keys, not the RSA key that signs access tokens, and access
// tokens carry no `kid`. Until that is reconciled on the SovGrant side, keep
// dev/e2e on the shared secret; point SG_JWKS_URL at a JWKS that actually
// contains the access-token signing key once it exists.

const issuer = () => process.env.SG_ISSUER ?? "sovgrant";

/** Resolved once; jose caches the remote key set internally. */
let remoteJwks: JWTVerifyGetKey | null = null;

function getJwks(): JWTVerifyGetKey | null {
  const url = process.env.SG_JWKS_URL;
  if (!url) return null;
  remoteJwks ??= createRemoteJWKSet(new URL(url));
  return remoteJwks;
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
 * Uses JWKS/RS256 when SG_JWKS_URL is configured, else the shared secret/HS256.
 * Throws jose errors on failure - caught by the error boundary.
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

  const secret = new TextEncoder().encode(process.env.SG_JWT_SECRET!);
  const { payload } = await jwtVerify(token, secret, {
    issuer: issuer(),
    algorithms: ["HS256"],
  });
  return payload as SgTokenPayload;
}
