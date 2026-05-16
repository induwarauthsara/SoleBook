"use client";

import { ArrowRight } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

export function CTASection() {
  const { t } = useLocale();

  return (
    <section
      id="waitlist"
      className="relative isolate overflow-hidden bg-[#F8FAFC]"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="relative isolate overflow-hidden rounded-3xl bg-[#0F172A] px-6 py-14 sm:px-10 sm:py-20 lg:px-16">
          <div aria-hidden className="hue-duotone-dark absolute inset-0" />
          <div
            aria-hidden
            className="bg-dot-grid-dark pointer-events-none absolute inset-0 z-[1] opacity-50"
          />

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[44px] lg:leading-[1.1]">
              Run your business <br />
              <span className="text-[#F27344]">like it&apos;s meant to grow.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-snow-200 sm:text-lg">
              Bring your bank, your business and your goals — leave the cash
              chaos behind.
            </p>
            <a
              href="/dashboard"
              className="group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#F27344] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#F27344]/25 transition hover:bg-[#D45F33]"
            >
              {t.nav.getStarted}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
