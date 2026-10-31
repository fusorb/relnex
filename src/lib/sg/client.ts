/**
 * Sg integration boundary for Relnex.
 *
 * The actual HTTP client lives in `@fusorb/facet-sdk`. This module re-exports
 * it, adds the local error type + `unwrap` helper, and builds the configured
 * server-side client so the rest of the repo never hand-rolls endpoints.
 */

import { SgClient, AuthSdk, type ApiResponse } from "@fusorb/facet-sdk";

export { SgClient, AuthSdk };
export type {
  User as SgIdentity,
  LoginResult,
  RegisterResult,
  TokenBundle,
  RefreshResult,
} from "@fusorb/facet-sdk";

export class SgError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message);
    this.name = "SgError";
  }
}

/**
 * Unwraps an SDK `ApiResponse<T>` envelope (or the promise resolving to it),
 * throwing a local `SgError` on failure and returning the inner payload.
 */
export async function unwrap<T>(
  res: ApiResponse<T> | Promise<ApiResponse<T>>
): Promise<T> {
  const r = await res;
  if (r.error) {
    throw new SgError(r.error.message, r.error.statusCode, r.error.error);
  }
  return r.data;
}

const SERVER_BASE_URL = process.env.SG_API_URL ?? "http://localhost:4000";

/**
 * Builds a server-side `SgClient`. Server-to-server calls (register/login/
 * password reset) authenticate with the M2M service token; per-request user
 * tokens override it when present.
 */
export function createServerSgClient(accessToken?: string): SgClient {
  const client = new SgClient({
    baseUrl: SERVER_BASE_URL,
    clientId: process.env.SG_CLIENT_ID,
  });
  client.setAccessToken(accessToken ?? process.env.SG_SERVICE_TOKEN ?? null);
  return client;
}
