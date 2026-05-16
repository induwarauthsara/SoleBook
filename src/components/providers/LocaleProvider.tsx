"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { dictionary, type Dictionary, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "solebook.locale";

// ---------------------------------------------------------------------------
// External store: a tiny pub/sub on top of localStorage. Used with
// useSyncExternalStore so we get safe SSR + lint-clean hydration without
// the setState-in-effect anti-pattern.
// ---------------------------------------------------------------------------

let currentLocale: Locale = "en";
let initialized = false;
const subscribers = new Set<() => void>();

function readFromStorage(): Locale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    return saved && saved in dictionary ? saved : "en";
  } catch {
    return "en";
  }
}

function getSnapshot(): Locale {
  if (!initialized && typeof window !== "undefined") {
    currentLocale = readFromStorage();
    initialized = true;
  }
  return currentLocale;
}

function getServerSnapshot(): Locale {
  return "en";
}

function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function commit(next: Locale) {
  currentLocale = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  } catch {
    /* ignore */
  }
  subscribers.forEach((listener) => listener());
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setLocale = useCallback((l: Locale) => {
    commit(l);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: dictionary[locale] }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
