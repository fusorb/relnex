// Sg integration barrel — import the HTTP SDK from here, not individual files
// Auth guards, JWT verification, and session management come from @/core/auth
export { sg, SgError } from "./client";
export type { SgIdentity, LoginResult, RegisterResult, TokenBundle } from "./client";
