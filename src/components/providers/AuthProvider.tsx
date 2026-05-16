"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { mockUser } from "@/lib/mock-data";
import type { UserProfile } from "@/types/app";

const STORAGE_KEY = "solebook.auth.user";

// ---------------------------------------------------------------------------
// External store (pub/sub over localStorage). `useSyncExternalStore` reads
// it during render, so hydration is lint-clean and SSR returns null.
// ---------------------------------------------------------------------------

let initialized = false;
let currentUser: UserProfile | null = null;
const subscribers = new Set<() => void>();

function readFromStorage(): UserProfile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function getSnapshot(): UserProfile | null {
  if (!initialized) {
    currentUser = readFromStorage();
    initialized = true;
  }
  return currentUser;
}

function getServerSnapshot(): UserProfile | null {
  return null;
}

function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function commit(next: UserProfile | null) {
  currentUser = next;
  try {
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
  subscribers.forEach((listener) => listener());
}

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  signIn: (input?: Partial<UserProfile>) => void;
  signOut: () => void;
  updateUser: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * A small client-side auth context backed by localStorage. The shape
 * is deliberately compatible with what Supabase auth will return
 * later, so screens do not need to be rewritten when we wire a
 * backend.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // True only after the component has mounted on the client, so we never
  // trigger an auth redirect during SSR/the hydration render.
  const [isHydrated, setHydrated] = useState(false);
  useEffect(() => {
    // Marks the boundary between SSR/hydration render and subsequent
    // client renders so the (app) layout never redirects mid-hydration.
    // The cascading re-render is one-shot and intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  const signIn = useCallback((input?: Partial<UserProfile>) => {
    commit({ ...mockUser, ...input });
  }, []);

  const signOut = useCallback(() => {
    commit(null);
  }, []);

  const updateUser = useCallback(
    (patch: Partial<UserProfile>) => {
      if (!currentUser) return;
      commit({ ...currentUser, ...patch });
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isHydrated,
      signIn,
      signOut,
      updateUser,
    }),
    [user, isHydrated, signIn, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
