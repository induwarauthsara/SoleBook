"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionary, type Dictionary, type Locale } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "solebook.locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && saved in dictionary) setLocaleState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  };

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: dictionary[locale] }),
    [locale]
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
