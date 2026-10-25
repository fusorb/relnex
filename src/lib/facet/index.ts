/**
 * Facet SDK integration for Relnex
 *
 * Re-exports from the facet packages for convenient access.
 */

// Re-export client factory
export {
  createClientSideClient,
  createServerSideClient,
  getClientSideClient,
} from "./client";

// Re-export SDK factory
export { createSdks, getClientSdks } from "./sdks";
export type { Sdks } from "./sdks";

// Re-export types from facet-sdk
export type {
  SgClient,
  AuthSdk,
  TenantSdk,
  IdentitySdk,
  PasskeySdk,
} from "@fusorb/facet-sdk";