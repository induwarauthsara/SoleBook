import Image from "next/image";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Coins,
  TrendingUp,
  XCircle,
} from "lucide-react";

export function OwnerSalary() {
  return (
    <section className="relative isolate overflow-hidden bg-[#F8FAFC]">
      <div aria-hidden className="hue-orange opacity-80" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Visual: before / after */}
          <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
            {/* Before */}
            <div className="rounded-2xl border border-snow-300 bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-100">
                <XCircle className="size-3.5 text-[#F27344]" aria-hidden />
                Before SoleBook
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-200">
                {[
                  { day: "5th", amt: "Rs 30,000" },
                  { day: "11th", amt: "Rs 12,000" },
                  { day: "19th", amt: "Rs 45,000" },
                  { day: "28th", amt: "Rs 8,000" },
                ].map((r) => (
                  <li
                    key={r.day}
                    className="flex items-center justify-between rounded-lg border border-snow-300 bg-snow-100 px-3 py-2"
                  >
                    <span className="text-ink-50">{r.day}</span>
                    <span className="font-medium">{r.amt}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink-100">
                Random withdrawals. No predictability. Payroll feels the impact.
              </p>
            </div>

            {/* After */}
            <div className="relative rounded-2xl border border-[#F27344]/30 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B14A24]">
                <CheckCircle2 className="size-3.5 text-[#F27344]" aria-hidden />
                With SoleBook
              </div>
              <div className="mt-4 rounded-xl bg-[#0F172A] p-4 text-white">
                <div className="text-[11px] font-medium uppercase tracking-wider text-snow-500">
                  Monthly owner salary
                </div>
                <div className="mt-1 text-2xl font-semibold">Rs 95,000</div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-snow-200">
                  <Calendar className="size-3.5" aria-hidden />
                  Paid on the 1st of every month
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-ink-100">
                <li className="flex items-center gap-2">
                  <TrendingUp className="size-3.5 text-[#F27344]" aria-hidden />
                  Stable, predictable, disciplined
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-[#F27344]" aria-hidden />
                  Business cash isn&apos;t bleeding into personal life
                </li>
              </ul>
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <Image
              src="/assets/clipart1.png"
              alt=""
              width={520}
              height={380}
              className="mb-4 h-auto w-56 sm:w-64"
              aria-hidden
            />
            <span className="inline-flex items-center gap-2 rounded-full bg-peach-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#B14A24]">
              <Coins className="size-3.5" aria-hidden />
              Pay yourself properly
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink-300 sm:text-4xl">
              You&apos;re not the business. <br />
              <span className="text-[#F27344]">You&apos;re its most important employee.</span>
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-ink-100 sm:text-lg">
              Most owners take money randomly — and it quietly destroys cash
              flow. SoleBook helps you set a salary you can rely on, then warns
              you the moment personal withdrawals start hurting the business.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-ink-200">
              {[
                "Set a monthly salary goal you can actually pay.",
                "Track withdrawals against the goal automatically.",
                "Get a heads-up before personal spending breaks payroll.",
                "Build a clean financial identity banks recognise.",
              ].map((s) => (
                <li key={s} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-[#F27344]"
                    aria-hidden
                  />
                  {s}
                </li>
              ))}
            </ul>

            <a
              href="#waitlist"
              className="group mt-7 inline-flex items-center gap-1.5 rounded-full bg-[#F27344] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D45F33]"
            >
              Set my owner salary
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
