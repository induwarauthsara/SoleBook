"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserProfile } from "@/types/app";

const STORAGE_KEY = "solebook.auth.session";

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

interface AuthContextValue {
  user: UserProfile | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ requires_2fa?: boolean; session_token?: string }>;
  signUp: (data: { email: string; password: string; full_name: string; business_name: string; business_type: string }) => Promise<void>;
  verify2FA: (sessionToken: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredSession(): { session: AuthSession | null; user: UserProfile | null } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { session: null, user: null };
    return JSON.parse(raw);
  } catch {
    return { session: null, user: null };
  }
}

function storeSession(session: AuthSession | null, user: UserProfile | null) {
  try {
    if (session && user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ session, user }));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrated, setHydrated] = useState(false);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    const stored = getStoredSession();
    if (stored.session && stored.user) {
      setSession(stored.session);
      setUser(stored.user);
    }
    setHydrated(true);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      if (data.requires_2fa) {
        return { requires_2fa: true, session_token: data.session_token };
      }

      const newSession: AuthSession = data.session;
      const newUser: UserProfile = {
        id: data.user.id,
        name: data.user.full_name || email.split("@")[0],
        email: data.user.email,
      };
      setSession(newSession);
      setUser(newUser);
      storeSession(newSession, newUser);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (data: { email: string; password: string; full_name: string; business_name: string; business_type: string }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Registration failed");

      const newUser: UserProfile = { id: result.user.id, name: data.full_name, email: data.email };
      setUser(newUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (sessionToken: string, code: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: sessionToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "2FA verification failed");

      const newSession: AuthSession = data.session;
      const newUser: UserProfile = {
        id: data.user.id,
        name: data.user.full_name || data.user.email.split("@")[0],
        email: data.user.email,
      };
      setSession(newSession);
      setUser(newUser);
      storeSession(newSession, newUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (session) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});
    }
    setSession(null);
    setUser(null);
    storeSession(null, null);
  }, [session]);

  const updateUser = useCallback((patch: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      storeSession(session, updated);
      return updated;
    });
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: !!user && !!session,
      isHydrated,
      isLoading,
      signIn,
      signUp,
      verify2FA,
      signOut,
      updateUser,
    }),
    [user, session, isHydrated, isLoading, signIn, signUp, verify2FA, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
