import {
  Brain,
  Building2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

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
    <section id="how-it-works" className="relative isolate overflow-hidden bg-white">
      <div aria-hidden className="hue-orange" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
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
          {steps.map((s) => (
            <li key={s.n} className="relative">
              <SpotlightCard
                className="h-full rounded-2xl border border-snow-300 bg-white p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-prussian-500/30 hover:shadow-md"
                spotlightColor="rgba(30, 54, 93, 0.22)"
              >
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
              </SpotlightCard>

            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
