"use client";

import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

export function Hero() {
  const { t } = useLocale();

  return (
    <section
      id="product"
      className="relative isolate flex min-h-screen items-center overflow-hidden bg-[#F8FAFC]"
    >
      {/* Duotone ambient — blue calm + orange accent */}
      <div aria-hidden className="hue-duotone" />
      <div
        aria-hidden
        className="bg-dot-grid pointer-events-none absolute inset-0 z-[1] [mask-image:radial-gradient(ellipse_at_top,black_45%,transparent_75%)]"
      />

      {/* Right-side full-bleed image (absolute on lg+, normal block on mobile).
          Width is exactly 50% so the image plane can never cross into the text column. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-[2] hidden lg:block lg:w-1/2"
      >
        <div className="relative h-full w-full">
          {/* Peach wash that ties the image to the brand */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 bg-gradient-to-br from-[#F27344]/20 via-[#F27344]/5 to-transparent blur-3xl"
          />

          <Image
            src="/assets/hero.jpg"
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover [object-position:60%_50%]"
          />

          {/*
            Gradual left-edge transition into the page background.
            Two stacked gradients give a long, soft falloff instead of a hard seam.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[38%]
                       bg-[linear-gradient(to_right,#F8FAFC_0%,rgba(248,250,252,0.94)_24%,rgba(248,250,252,0.72)_48%,rgba(248,250,252,0.38)_72%,rgba(248,250,252,0)_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[24%]
                       bg-[radial-gradient(ellipse_at_left,_rgba(248,250,252,0.55)_0%,_rgba(248,250,252,0)_70%)]"
          />
        </div>
      </div>

      {/* Contained content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 pt-10 pb-16 sm:pt-14 sm:pb-20 lg:grid-cols-2 lg:gap-16 lg:pt-20 lg:pb-24">
          {/* Text column — capped width + right buffer ensures it never reaches the image plane */}
          <div className="max-w-2xl lg:max-w-[34rem] lg:pr-6">
            <div className="animate-fade glass-orange inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-[#B14A24] uppercase">
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
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#F27344] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#F27344]/25 transition hover:bg-[#D45F33]"
              >
                {t.hero.ctaPrimary}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#how-it-works"
                className="glass-light inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-ink-200 transition hover:bg-white"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>

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

          {/* Mobile / tablet image (lg+ uses the absolute full-bleed above) */}
          <div className="relative w-full lg:hidden">
            <div className="relative h-[300px] w-full overflow-hidden rounded-3xl ring-1 ring-snow-300 sm:h-[420px]">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-[#F27344]/20 via-[#F27344]/5 to-transparent blur-2xl"
              />
              <Image
                src="/assets/hero.jpg"
                alt="SoleBook mobile app — dashboard, send money, and pay screens"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          </div>

          {/* Spacer on lg+ to reserve grid track for the absolute image */}
          <div aria-hidden className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
