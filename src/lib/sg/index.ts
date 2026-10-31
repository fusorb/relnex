// Sg integration barrel — import the SDK from here, not individual files.
// Auth guards, JWT verification, and session management come from @/core/auth.
export {
  SgClient,
  AuthSdk,
  SgError,
  unwrap,
  createServerSgClient,
} from "./client";
export type {
  SgIdentity,
  LoginResult,
  RegisterResult,
  TokenBundle,
  RefreshResult,
} from "./client";
