/**
 * Sg HTTP SDK Client for Relnex
 *
 * This is the integration contract between Relnex and Sg.
 * All auth operations go through these methods.
 * Never call Sg endpoints directly from Relnex components or routes —
 * always use this client.
 */

const SG_BASE_URL = process.env.SG_API_URL ?? "http://localhost:4000";
const SG_SERVICE_TOKEN = process.env.SG_SERVICE_TOKEN!; // M2M token for server-to-server

type FetchOptions = {
  method?: string;
  body?: unknown;
  token?: string; // user's access token for proxied calls
};

async function sgFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: options.token
      ? `Bearer ${options.token}`
      : `Bearer ${SG_SERVICE_TOKEN}`,
  };

  const res = await fetch(`${SG_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new SgError(
      err.message ?? "Sg request failed",
      res.status,
      err.error ?? "SG_ERROR"
    );
  }

  return res.json();
}

export class SgError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message);
    this.name = "SgError";
  }
}

// ── Identity ──────────────────────────────────────────────────────────────────

export interface SgIdentity {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  status: string;
  emailVerified: boolean;
  globalRole: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface RegisterResult {
  identity: SgIdentity;
}

export interface LoginResult {
  sessionId: string;
  requiresMfa: boolean;
  mfaTypes: string[];
  accessToken?: string;
  refreshToken?: string;
}

export interface TokenBundle {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  token_type: "Bearer";
  expires_in: number;
}

export const sg = {
  // ── Registration ────────────────────────────────────────────────────────

  async register(email: string, password: string, name?: string): Promise<RegisterResult> {
    const res = await sgFetch<{ success: boolean; data: RegisterResult }>(
      "/auth/register",
      { method: "POST", body: { email, password, name } }
    );
    return res.data;
  },

  // ── Login ────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<LoginResult> {
    const res = await sgFetch<{ success: boolean; data: LoginResult }>(
      "/auth/login",
      { method: "POST", body: { email, password } }
    );
    return res.data;
  },

  // ── MFA ──────────────────────────────────────────────────────────────────

  async verifyMfa(sessionId: string, code: string): Promise<LoginResult> {
    const res = await sgFetch<{ success: boolean; data: LoginResult }>(
      "/auth/mfa/verify",
      { method: "POST", body: { sessionId, code } }
    );
    return res.data;
  },

  // ── Token operations ─────────────────────────────────────────────────────

  async refreshToken(refreshToken: string): Promise<TokenBundle> {
    return sgFetch<TokenBundle>("/oauth/token", {
      method: "POST",
      body: {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.SG_CLIENT_ID!,
      },
    });
  },

  async logout(sessionId: string, accessToken: string): Promise<void> {
    await sgFetch("/auth/logout", {
      method: "POST",
      body: { sessionId },
      token: accessToken,
    });
  },

  async revokeToken(token: string): Promise<void> {
    await sgFetch("/oauth/revoke", {
      method: "POST",
      body: {
        token,
        client_id: process.env.SG_CLIENT_ID!,
      },
    });
  },

  // ── Identity profile ─────────────────────────────────────────────────────

  async getIdentity(accessToken: string): Promise<SgIdentity> {
    const res = await sgFetch<{ success: boolean; data: SgIdentity }>(
      "/identity/profile",
      { token: accessToken }
    );
    return res.data;
  },

  async updateIdentity(
    accessToken: string,
    data: { name?: string; picture?: string; metadata?: Record<string, unknown> }
  ): Promise<SgIdentity> {
    const res = await sgFetch<{ success: boolean; data: SgIdentity }>(
      "/identity/profile",
      { method: "PATCH", body: data, token: accessToken }
    );
    return res.data;
  },

  // ── Password ─────────────────────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<void> {
    await sgFetch("/auth/password/reset", {
      method: "POST",
      body: { email },
    });
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await sgFetch("/auth/password/reset/confirm", {
      method: "POST",
      body: { token, newPassword },
    });
  },

  // ── Email verification ────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<void> {
    await sgFetch("/auth/email/verify", {
      method: "POST",
      body: { token },
    });
  },

  // ── Token introspection (server-to-server) ────────────────────────────────

  async introspect(token: string): Promise<{ active: boolean; sub?: string; scope?: string }> {
    return sgFetch("/oauth/introspect", {
      method: "POST",
      body: { token },
    });
  },
};
