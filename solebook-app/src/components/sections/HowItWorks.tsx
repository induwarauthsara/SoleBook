import {
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Building2,
    title: "Connect your existing bank",
    body:
      "Link your current account in minutes — no new bank, no new app for your customers. SoleBook reads cash movements through secure bank APIs.",
  },
  {
    n: "02",
    icon: Brain,
    title: "AI watches the money in",
    body:
      "When income arrives, SoleBook looks at upcoming bills, supplier dues, salaries, and your business pattern — then proposes a split.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "You approve the allocation",
    body:
      "Operations · Obligations · Profit Reserve · Owner Salary. Accept the suggestion or adjust it. You stay in control. AI never moves money on its own.",
  },
  {
    n: "04",
    icon: CheckCircle2,
    title: "Stay disciplined, automatically",
    body:
      "SoleBook reserves what&apos;s due, warns before risks, and tracks owner withdrawals — so you finish the month confident, not surprised.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-peach-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#B14A24]">
            <Sparkles className="size-3.5" aria-hidden />
            How SoleBook works
          </span>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink-300 sm:text-4xl">
            A financial discipline layer over your bank — not a replacement.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-100 sm:text-lg">
            Four steps from your customer&apos;s payment to a calmer month-end.
            Every step is explainable, every action stays with you.
          </p>
        </div>

        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.n} className="relative">
              <div className="group h-full rounded-2xl border border-snow-300 bg-white p-6 transition hover:-translate-y-1 hover:border-[#F27344]/30 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#0F172A] text-white">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold tracking-widest text-ink-50">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-snug text-ink-300">
                  {s.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed text-ink-100"
                  dangerouslySetInnerHTML={{ __html: s.body }}
                />
              </div>

              {/* Connector arrow on lg screens between cards */}
              {i < steps.length - 1 && (
                <ArrowRight
                  className="absolute top-1/2 -right-3 hidden size-5 -translate-y-1/2 text-snow-400 lg:block"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
