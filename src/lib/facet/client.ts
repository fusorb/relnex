/**
 * SgClient factory for Relnex
 *
 * Creates an SgClient instance configured for SG integration.
 * This client is used by facet-store for token refresh and by
 * facet-auth for authentication operations.
 */

import { SgClient } from "@fusorb/facet-sdk";

// Client-side base URL (exposed to browser)
const CLIENT_BASE_URL =
  process.env.NEXT_PUBLIC_SG_API_URL ?? "http://localhost:4000";

// Server-side base URL (internal only)
const SERVER_BASE_URL = process.env.SG_API_URL ?? "http://localhost:4000";

/**
 * Creates an SgClient for client-side (browser) use.
 * Use this for components that need to call SG directly.
 */
export function createClientSideClient(): SgClient {
  return new SgClient({
    baseUrl: CLIENT_BASE_URL,
    clientId: process.env.NEXT_PUBLIC_SG_CLIENT_ID,
  });
}

/**
 * Creates an SgClient for server-side use.
 * Use this in API routes and server components.
 */
export function createServerSideClient(accessToken?: string): SgClient {
  const client = new SgClient({
    baseUrl: SERVER_BASE_URL,
    clientId: process.env.SG_CLIENT_ID,
  });

  if (accessToken) {
    client.setAccessToken(accessToken);
  }

  return client;
}

/**
 * Singleton client for client-side use.
 * Created once and reused across components.
 */
let clientSideClient: SgClient | null = null;

export function getClientSideClient(): SgClient {
  if (!clientSideClient) {
    clientSideClient = createClientSideClient();
  }
  return clientSideClient;
}
