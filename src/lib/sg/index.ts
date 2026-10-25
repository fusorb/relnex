// Arc-ID integration barrel — import the HTTP SDK from here, not individual files
// Auth guards, JWT verification, and session management come from @/core/auth
export { arcid, ArcIDError } from "./client";
export type { ArcIDIdentity, LoginResult, RegisterResult, TokenBundle } from "./client";
