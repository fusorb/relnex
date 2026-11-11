"use client";

// Browser-side SgClient (facet-sdk). The browser talks to SovGrant directly as
// an OIDC client (see docs/frontend-plan / plan §5 Model A). Server-to-server
// calls keep using createServerSgClient() in ./client.ts.
import { SgClient } from "@fusorb/facet-sdk";

const BASE_URL = process.env.NEXT_PUBLIC_SG_API_URL ?? "http://localhost:4000";
const CLIENT_ID = process.env.NEXT_PUBLIC_SG_CLIENT_ID ?? "relnex";

export const browserSgClient = new SgClient({
  baseUrl: BASE_URL,
  clientId: CLIENT_ID,
});
