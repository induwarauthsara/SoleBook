"use client";

import { ArrowRight, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { HeroDashboard } from "./HeroDashboard";

export function Hero() {
  const { t } = useLocale();

  return (
    <section
      id="product"
      className="relative isolate overflow-hidden bg-[#F8FAFC]"
    >
      {/* Backdrop */}
      <div
        aria-hidden
        className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_45%,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-[-10%] h-[520px] w-[520px] rounded-full bg-[#F27344]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-[-10%] h-[420px] w-[420px] rounded-full bg-[#1E293B]/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:flex lg:items-center lg:gap-12 lg:px-8 lg:pt-20 lg:pb-28">
        {/* Copy */}
        <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-1 lg:max-w-xl">
          <div className="animate-fade inline-flex items-center gap-2 rounded-full border border-[#F27344]/20 bg-[#F27344]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#B14A24] uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            {t.hero.eyebrow}
          </div>

          <h1 className="animate-rise mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink-300 sm:text-5xl lg:text-[58px]">
            <span className="block">{t.hero.titleA}</span>
            <span className="block text-[#F27344]">{t.hero.titleB}</span>
          </h1>

          <p className="animate-rise mt-5 max-w-xl text-pretty text-base leading-relaxed text-ink-100 sm:text-lg">
            {t.hero.sub}
          </p>

          <div className="animate-rise mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#waitlist"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#F27344] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D45F33]"
            >
              {t.hero.ctaPrimary}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-snow-300 bg-white px-6 py-3 text-sm font-semibold text-ink-200 transition hover:bg-snow-100"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>

          {/* Trust row */}
          <div className="animate-fade mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-100">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-[#F27344]" aria-hidden />
              Bank-grade architecture
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="size-4 text-[#F27344]" aria-hidden />
              AI that recommends, never auto-spends
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <Sparkles className="size-4 text-[#F27344]" aria-hidden />
              Sinhala · Tamil · English
            </span>
          </div>
        </div>

        {/* Visual */}
        <div className="mt-14 lg:mt-0 lg:flex-1">
          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}
