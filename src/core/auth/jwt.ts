import {
  jwtVerify,
  createRemoteJWKSet,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";
import { ApiError } from "@/lib/errors/api-error";

// The single token-verification seam for Relnex. Both the proxy and the
// session guards call verifySgToken, so swapping trust anchors touches only
// this file.
//
// Two trust anchors are supported, resolved in this order:
//   1. JWKS (RS256) - the production contract. Active when SG_JWKS_URL is
//      set; keys are fetched from SovGrant and cached by jose. SovGrant
//      publishes the RSA access-token signing key (with the `kid` its tokens
//      carry) alongside the tenant VC/DID keys, so this is the real path -
//      the pinned-public-key interim anchor is retired.
//   2. Shared secret (HS256) - the first-party shortcut for local dev / e2e
//      when no JWKS is configured (SovGrant signs HS256 only while no RSA
//      key pair is configured).
//
// The algorithm is pinned per anchor so a token cannot downgrade it.
//
// Access tokens are also type-discriminated: SovGrant stamps token_use
// ("access" / "id") because the ID token is signed with the same key, and a
// valid signature alone must not let an ID token act as a bearer credential.

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
  sub:       string;    // Sg Identity.id
  jti:       string;
  scope:     string;    // space-separated
  aud:       string[];
  tid?:      string;    // tenantId
  token_use: "access";  // discriminator - see the header note
}

/**
 * Verifies a Sg access token locally (no network call to SovGrant per request).
 * Prefers JWKS (SG_JWKS_URL), then the shared secret (SG_JWT_SECRET). Throws
 * jose errors on signature/claim failures, and ApiError.unauthorized when the
 * token is not an access token - both are caught by the error boundary.
 */
export async function verifySgToken(token: string): Promise<SgTokenPayload> {
  const jwks = getJwks();
  const { payload } = jwks
    ? await jwtVerify(token, jwks, {
        issuer: issuer(),
        algorithms: ["RS256"],
      })
    : await jwtVerify(token, new TextEncoder().encode(process.env.SG_JWT_SECRET!), {
        issuer: issuer(),
        algorithms: ["HS256"],
      });

  // Access and ID tokens share a signing key, so signature verification alone
  // cannot tell them apart. SovGrant stamps every access token with
  // token_use: "access"; anything else - including an unmarked token - is
  // rejected before it can act as a bearer credential.
  if (payload.token_use !== "access") {
    throw ApiError.unauthorized("Invalid token type: expected an access token");
  }

  return payload as SgTokenPayload;
}
