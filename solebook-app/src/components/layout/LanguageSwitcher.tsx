"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localeMeta, type Locale } from "@/lib/i18n";

interface Props {
  tone?: "light" | "dark";
}

export function LanguageSwitcher({ tone = "light" }: Props) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const triggerCls =
    tone === "dark"
      ? "border-white/15 text-snow-100 hover:bg-white/5"
      : "border-snow-300 text-ink-300 hover:bg-snow-200/70";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${triggerCls}`}
      >
        <Globe className="size-3.5" aria-hidden />
        <span>{localeMeta[locale].short}</span>
        <ChevronDown
          className={`size-3.5 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-snow-300 bg-white p-1 shadow-xl ring-1 ring-black/5"
        >
          {(Object.keys(localeMeta) as Locale[]).map((l) => {
            const active = l === locale;
            return (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setLocale(l);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-peach-50 text-peach-700"
                      : "text-ink-200 hover:bg-snow-100"
                  }`}
                >
                  <span className="flex flex-col items-start leading-tight">
                    <span className="font-medium">{localeMeta[l].native}</span>
                    <span className="text-[11px] text-ink-50">
                      {localeMeta[l].label}
                    </span>
                  </span>
                  {active && <Check className="size-4" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
