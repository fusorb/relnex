"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiClient } from "@/lib/useful/api-client";

interface Identity {
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

interface User {
  id: string;
  identityId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  email?: string | null;
  hasCompletedOnboarding?: boolean;
}

interface AuthState {
  user: User | null;
  identity: Identity | null;
  loading: boolean;
  isLoggedIn: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ requiresMfa: boolean; sessionId?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    identity: null,
    loading: true,
    isLoggedIn: false,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await apiClient<{
        success: boolean;
        data: User & { onboardingStep?: number };
      }>("/api/auth/me");
      setState({
        user: res.data,
        identity: null,
        loading: false,
        isLoggedIn: true,
      });
    } catch {
      setState({
        user: null,
        identity: null,
        loading: false,
        isLoggedIn: false,
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await apiClient<{
      success: boolean;
      data: {
        requiresMfa: boolean;
        sessionId?: string;
      };
    }>("/api/auth/login", { method: "POST", bodyData: { email, password } });

    if (!res.data.requiresMfa) await refresh();
    return { requiresMfa: res.data.requiresMfa, sessionId: res.data.sessionId };
  };

  const logout = async () => {
    await apiClient("/api/auth/logout", { method: "POST" });
    setState({ user: null, identity: null, loading: false, isLoggedIn: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside <AuthProvider>");
  }
  return ctx;
}
