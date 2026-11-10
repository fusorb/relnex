import { jwtVerify, type JWTPayload } from "jose";

const secret = () => new TextEncoder().encode(process.env.SG_JWT_SECRET!);
const ISSUER = process.env.SG_ISSUER ?? "sg";

export interface SgTokenPayload extends JWTPayload {
  sub:    string;    // Sg Identity.id
  jti:    string;
  scope:  string;    // space-separated
  aud:    string[];
  tid?:   string;    // tenantId
}

/**
 * Verifies a Sg access token locally (no network call).
 * Throws jose errors on failure - caught by error boundary.
 */
export async function verifySgToken(token: string): Promise<SgTokenPayload> {
  const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER });
  return payload as SgTokenPayload;
}
