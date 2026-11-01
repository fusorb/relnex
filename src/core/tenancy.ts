// Reserved personal scope for users/content with no SovGrant tenant.
// Matches the @default("relnex-default") on tenant-scoped models.
export const DEFAULT_TENANT_ID = "relnex-default";

/** Normalizes an optional/absent tenant id to the reserved default scope. */
export function resolveTenantId(tenantId?: string | null): string {
  return tenantId ?? DEFAULT_TENANT_ID;
}
