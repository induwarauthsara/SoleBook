"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Brain,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Coins,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

/**
 * Visual mock of a SoleBook AI allocation moment — the "hero shot."
 * Stays strictly within the brand palette (peach + prussian + deepspace + snow + ink).
 */
export function HeroDashboard() {
  const buckets = [
    {
      icon: Briefcase,
      label: "Operations",
      pct: 55,
      amount: "Rs 55,000",
    },
    {
      icon: CalendarClock,
      label: "Obligations",
      pct: 25,
      amount: "Rs 25,000",
    },
    {
      icon: ShieldCheck,
      label: "Profit Reserve",
      pct: 10,
      amount: "Rs 10,000",
    },
    {
      icon: Coins,
      label: "Owner Salary",
      pct: 10,
      amount: "Rs 10,000",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* Floating "income received" chip — top left */}
      <div className="animate-float absolute -left-3 -top-5 z-20 hidden sm:block">
        <div className="flex items-center gap-2 rounded-2xl border border-snow-300 bg-white px-3.5 py-2.5 shadow-lg">
          <span className="relative inline-flex size-8 items-center justify-center rounded-full bg-peach-50">
            <ArrowDownLeft className="size-4 text-[#F27344]" aria-hidden />
            <span className="animate-pulse-ring absolute inset-0 rounded-full border border-[#F27344]" />
          </span>
          <div className="leading-tight">
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink-50">
              Payment received
            </div>
            <div className="text-sm font-semibold text-ink-300">
              + Rs 100,000
            </div>
          </div>
        </div>
      </div>

      {/* Floating "discipline score" chip — bottom right */}
      <div className="animate-float absolute -right-2 -bottom-5 z-20 hidden sm:block">
        <div className="flex items-center gap-2.5 rounded-2xl border border-snow-300 bg-white px-3.5 py-2.5 shadow-lg">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#0F172A] text-white">
            <TrendingUp className="size-4" aria-hidden />
          </span>
          <div className="leading-tight">
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink-50">
              Discipline score
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-ink-300">82/100</span>
              <span className="text-[10px] font-semibold text-[#F27344]">
                ↑ 11%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="shadow-peach-glow relative overflow-hidden rounded-3xl border border-deepspace-500/40 bg-[#0F172A] p-5 sm:p-6">
        <div
          aria-hidden
          className="bg-dot-grid-dark pointer-events-none absolute inset-0 opacity-60"
        />

        <div className="relative">
          {/* Card header */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-snow-100">
              <span className="relative inline-flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F27344] opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[#F27344]" />
              </span>
              AI Allocation Engine
            </div>
            <span className="text-[11px] text-snow-500">Today · 2:14 PM</span>
          </div>

          {/* Hero metric */}
          <div className="mt-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-snow-500">
              Recommended allocation
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Rs 100,000
              </span>
              <span className="rounded-md bg-[#F27344]/15 px-2 py-0.5 text-[11px] font-semibold text-[#F27344]">
                New income
              </span>
            </div>
          </div>

          {/* Stacked allocation bar */}
          <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-white/5">
            {buckets.map((b, i) => (
              <div
                key={b.label}
                className="h-full"
                style={{
                  width: `${b.pct}%`,
                  backgroundColor:
                    i === 0
                      ? "#F27344"
                      : i === 1
                        ? "#FBA378"
                        : i === 2
                          ? "#5C7396"
                          : "#93A2BB",
                }}
              />
            ))}
          </div>

          {/* Buckets */}
          <ul className="mt-5 grid grid-cols-2 gap-2.5">
            {buckets.map((b) => (
              <li
                key={b.label}
                className="rounded-xl border border-white/5 bg-[#1E293B] p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#F27344]/15 text-[#F27344]">
                    <b.icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="text-[11px] font-medium text-snow-100">
                    {b.label}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-white">
                    {b.amount}
                  </span>
                  <span className="text-[11px] font-medium text-snow-500">
                    {b.pct}%
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* AI insight */}
          <div className="mt-5 rounded-xl border border-[#F27344]/25 bg-[#F27344]/10 p-3.5">
            <div className="flex gap-2.5">
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#F27344] text-white">
                <Brain className="size-3.5" aria-hidden />
              </span>
              <div className="text-[12.5px] leading-relaxed text-snow-100">
                Reserve <span className="font-semibold text-white">Rs 25,000</span>{" "}
                for staff salaries due in 6 days and the CEB bill due Friday — your
                supplier payment is safe.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#F27344] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#D45F33]"
            >
              <CheckCircle2 className="size-3.5" aria-hidden />
              Accept allocation
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-snow-100 transition hover:bg-white/10"
            >
              Adjust
            </button>
          </div>
        </div>
      </div>

      {/* Mini quick-pay queue beneath */}
      <div className="mx-auto mt-3 hidden w-[88%] rounded-2xl border border-snow-300 bg-white p-3 shadow-sm sm:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#0F172A] text-white">
              <Sparkles className="size-3.5" aria-hidden />
            </span>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-50">
                Next obligation
              </div>
              <div className="text-[13px] font-semibold text-ink-300">
                Staff salaries · in 6 days
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-peach-50 px-2 py-1 text-[11px] font-semibold text-[#B14A24]">
              High
            </span>
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-300">
              Rs 145,000
              <ArrowUpRight className="size-3.5 text-ink-100" aria-hidden />
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 hidden text-center text-[11px] text-ink-50 sm:block">
        Illustrative — figures shown are demo data.
      </p>
    </div>
  );
}
