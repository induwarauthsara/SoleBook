"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { UserProfile } from "@/types/app";
import { messageFromApiBody, readJsonSafe } from "@/lib/api-error";

const STORAGE_KEY = "solebook.auth.session";

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

const TOKEN_REFRESH_LEEWAY_SEC = 120;

function sessionNeedsRefresh(s: AuthSession | null): boolean {
  if (!s?.refresh_token) return true;
  if (s.expires_at == null || s.expires_at === undefined) return true;
  const exp = typeof s.expires_at === "number" ? s.expires_at : Number(s.expires_at);
  if (!Number.isFinite(exp)) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return exp - TOKEN_REFRESH_LEEWAY_SEC <= nowSec;
}

async function fetchRefreshedSession(refreshToken: string): Promise<AuthSession | null> {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await readJsonSafe(res);
  if (!res.ok) return null;
  const body = data as Record<string, unknown>;
  const session = body.session as AuthSession | undefined;
  if (!session?.access_token || !session?.refresh_token) return null;
  return session;
}

interface AuthContextValue {
  user: UserProfile | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    requires_2fa?: boolean;
    session_token?: string;
    refresh_token?: string;
    expires_at?: number;
  }>;
  signUp: (data: { email: string; password: string; full_name: string; business_name: string; business_type: string }) => Promise<void>;
  verify2FA: (sessionToken: string, code: string, refreshToken?: string) => Promise<void>;
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
  const sessionRef = useRef<AuthSession | null>(null);
  const userRef = useRef<UserProfile | null>(null);
  const [isHydrated, setHydrated] = useState(false);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearLocalAuth = useCallback(() => {
    sessionRef.current = null;
    userRef.current = null;
    setSession(null);
    setUser(null);
    storeSession(null, null);
  }, []);

  const rotateSessionIfStale = useCallback(async () => {
    const s = sessionRef.current;
    const u = userRef.current;
    if (!s?.refresh_token || !u || !sessionNeedsRefresh(s)) return;
    const refreshed = await fetchRefreshedSession(s.refresh_token);
    if (!refreshed) {
      clearLocalAuth();
      return;
    }
    sessionRef.current = refreshed;
    setSession(refreshed);
    storeSession(refreshed, u);
  }, [clearLocalAuth]);

  useEffect(() => {
    let cancelled = false;

    const finishHydration = () => {
      if (!cancelled) setHydrated(true);
    };

    const run = async () => {
      const stored = getStoredSession();
      if (!stored.session || !stored.user) {
        finishHydration();
        return;
      }

      let sessionToUse = stored.session;

      if (sessionNeedsRefresh(stored.session)) {
        const refreshed = await fetchRefreshedSession(stored.session.refresh_token);
        if (!refreshed) {
          if (!cancelled) {
            storeSession(null, null);
            sessionRef.current = null;
            userRef.current = null;
            setSession(null);
            setUser(null);
          }
          finishHydration();
          return;
        }
        sessionToUse = refreshed;
      }

      if (cancelled) return;
      sessionRef.current = sessionToUse;
      userRef.current = stored.user;
      setSession(sessionToUse);
      setUser(stored.user);
      storeSession(sessionToUse, stored.user);
      finishHydration();
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session?.refresh_token || session.expires_at == null) return undefined;
    const exp =
      typeof session.expires_at === "number" ? session.expires_at : Number(session.expires_at);
    if (!Number.isFinite(exp)) return undefined;
    const nowSec = Math.floor(Date.now() / 1000);
    const msUntil = Math.max(8_000, (exp - nowSec - TOKEN_REFRESH_LEEWAY_SEC) * 1000);
    const id = window.setTimeout(() => {
      void rotateSessionIfStale();
    }, msUntil);
    return () => clearTimeout(id);
  }, [session?.access_token, session?.refresh_token, session?.expires_at, rotateSessionIfStale]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      void rotateSessionIfStale();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [rotateSessionIfStale]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(messageFromApiBody(data, "Login failed"));

      const body = data as Record<string, unknown>;
      if (body.requires_2fa) {
        return {
          requires_2fa: true,
          session_token: body.session_token as string | undefined,
          refresh_token: body.refresh_token as string | undefined,
          expires_at: body.expires_at as number | undefined,
        };
      }

      const newSession = body.session as AuthSession | undefined;
      const userPayload = body.user as { id?: string; email?: string; full_name?: string } | undefined;
      if (!newSession?.access_token || !newSession.refresh_token || !userPayload?.email) {
        throw new Error("Login succeeded but the server response was incomplete.");
      }
      const newUser: UserProfile = {
        id: userPayload.id ?? userPayload.email,
        name: userPayload.full_name || email.split("@")[0],
        email: userPayload.email,
      };
      sessionRef.current = newSession;
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
      const result = await readJsonSafe(res);
      if (!res.ok)
        throw new Error(messageFromApiBody(result, "Registration failed"));

      const payload = result as { user?: { id?: string } };
      const userId = payload.user?.id;
      if (!userId) throw new Error("Registration succeeded but the server response was incomplete.");
      const newUser: UserProfile = {
        id: userId,
        name: data.full_name,
        email: data.email,
      };
      setUser(newUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (sessionToken: string, code: string, refreshToken?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_token: sessionToken,
          code,
          ...(refreshToken ? { refresh_token: refreshToken } : {}),
        }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok)
        throw new Error(messageFromApiBody(data, "2FA verification failed"));

      const body = data as Record<string, unknown>;
      const newSession = body.session as AuthSession | undefined;
      const u = body.user as { id?: string; email?: string; full_name?: string } | undefined;
      if (!newSession?.access_token || !newSession.refresh_token || !u?.email) {
        throw new Error("Verification succeeded but the server response was incomplete.");
      }
      const newUser: UserProfile = {
        id: u.id ?? u.email,
        name: u.full_name || u.email.split("@")[0],
        email: u.email,
      };
      sessionRef.current = newSession;
      setSession(newSession);
      setUser(newUser);
      storeSession(newSession, newUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const token = sessionRef.current?.access_token;
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    try {
      window.sessionStorage.removeItem("solebook.pending2fa");
    } catch {
      /* ignore */
    }
    sessionRef.current = null;
    userRef.current = null;
    setSession(null);
    setUser(null);
    storeSession(null, null);
  }, []);

  const updateUser = useCallback((patch: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      /** Must read latest tokens — onboarding may call finish() in the same tick as signIn(). */
      const s = sessionRef.current;
      if (s) storeSession(s, updated);
      return updated;
    });
  }, []);

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
