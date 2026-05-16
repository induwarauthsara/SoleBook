import { AlertTriangle, ArrowDown, ShuffleIcon, Wallet, X } from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

const pains = [
  {
    title: "Personal & business money mixed",
    body: "Salaries, rent, and family expenses all flowing from the same current account.",
  },
  {
    title: "Cheques and dues forgotten",
    body: "Late penalties stack up. Suppliers stop extending credit when it matters most.",
  },
  {
    title: "Owner withdraws emotionally",
    body: "Money is taken whenever it 'feels safe' — leaving payroll short next week.",
  },
  {
    title: "No reserve, no cushion",
    body: "When sales dip, the only options are loans, savings, or delaying suppliers.",
  },
];

export function ProblemSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#F8FAFC]">
      <div aria-hidden className="hue-duotone" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-snow-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-100">
            <AlertTriangle className="size-3.5 text-[#F27344]" aria-hidden />
            The real reason SMEs struggle
          </span>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-ink-300 sm:text-4xl">
            Most SMEs don&apos;t fail from lack of revenue.
          </h2>
          <p className="mt-3 text-pretty text-lg font-semibold leading-relaxed text-[#F27344] sm:text-xl">
            They fail because money moves faster than discipline.
          </p>
          <p className="mt-2 text-pretty text-base leading-relaxed text-ink-100 sm:text-lg">
            One account does everything — and nothing is reserved for what&apos;s coming next.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-5 lg:items-stretch">
          {/* Visual flow card */}
          <div className="lg:col-span-2">
            <SpotlightCard
              className="h-full rounded-3xl border border-snow-300 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
              spotlightColor="rgba(242, 115, 68, 0.20)"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-50">
                Typical money flow
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-snow-300 bg-snow-100 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#F27344] text-white">
                      <Wallet className="size-4" aria-hidden />
                    </span>
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wider text-ink-50">
                        Income
                      </div>
                      <div className="text-sm font-semibold text-ink-300">
                        Customer payments
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="size-5 text-ink-50" aria-hidden />
                </div>

                <div className="rounded-xl border-2 border-dashed border-[#F27344]/30 bg-peach-50/40 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#0F172A] text-white">
                      <ShuffleIcon className="size-4" aria-hidden />
                    </span>
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wider text-[#B14A24]">
                        One messy current account
                      </div>
                      <div className="text-sm font-semibold text-ink-300">
                        Everything happens here
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="size-5 text-ink-50" aria-hidden />
                </div>

                <ul className="grid grid-cols-2 gap-2">
                  {[
                    "Suppliers",
                    "Rent",
                    "Salaries",
                    "Loans",
                    "Personal",
                    "Cards",
                  ].map((l) => (
                    <li
                      key={l}
                      className="flex items-center gap-2 rounded-lg border border-snow-300 bg-white px-2.5 py-2 text-xs font-medium text-ink-200"
                    >
                      <X className="size-3.5 shrink-0 text-[#F27344]" aria-hidden />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </SpotlightCard>
          </div>

          {/* Pains */}
          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
            {pains.map((p) => (
              <SpotlightCard
                as="li"
                key={p.title}
                className="rounded-2xl border border-snow-300 bg-white p-5 transition-[border-color,box-shadow] duration-300 hover:border-[#F27344]/40 hover:shadow-md"
                spotlightColor="rgba(242, 115, 68, 0.22)"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-peach-50 text-[#F27344]">
                    <AlertTriangle className="size-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-ink-300">
                      {p.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-100">
                      {p.body}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
