"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLocale } from "@/components/providers/LocaleProvider";

export function Header() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const SHOW_AT_TOP = 80;
    const DELTA = 8;

    const update = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastYRef.current;

      if (open) {
        setHidden(false);
      } else if (currentY <= SHOW_AT_TOP) {
        setHidden(false);
      } else if (Math.abs(diff) > DELTA) {
        setHidden(diff > 0);
      }

      lastYRef.current = currentY;
      tickingRef.current = false;
    };

    const onScroll = () => {
      if (!tickingRef.current) {
        tickingRef.current = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  const nav = [
    { href: "#product", label: t.nav.product },
    { href: "#how-it-works", label: t.nav.howItWorks },
    { href: "#for-smes", label: t.nav.forSMEs },
    { href: "#faq", label: t.nav.faq },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-snow-300 bg-white/92 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md backdrop-saturate-150 transition-transform duration-300 ease-out will-change-transform supports-backdrop-filter:bg-white/85 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="SoleBook home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-ink-100 transition-colors hover:text-ink-300"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher tone="light" />
          </div>
          <a
            href="#"
            className="hidden text-sm font-medium text-ink-100 transition-colors hover:text-ink-300 md:inline-flex"
          >
            {t.nav.signIn}
          </a>
          <a
            href="#waitlist"
            className="group hidden items-center gap-1.5 rounded-full bg-[#F27344] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D45F33] sm:inline-flex"
          >
            {t.nav.getStarted}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-lg text-ink-200 hover:bg-snow-200 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-snow-300 bg-white lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-ink-200 hover:bg-snow-100"
              >
                {n.label}
              </a>
            ))}
            <div className="flex items-center justify-between gap-3 pt-3">
              <LanguageSwitcher tone="light" />
              <a
                href="#waitlist"
                onClick={() => setOpen(false)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#F27344] px-4 py-2.5 text-sm font-semibold text-white"
              >
                {t.nav.getStarted}
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
