import Image from "next/image";
import {
  Briefcase,
  CalendarClock,
  Coins,
  ShieldCheck,
  Sprout,
} from "lucide-react";

const buckets = [
  {
    icon: Briefcase,
    name: "Operations",
    pct: "55%",
    body: "Daily working cash — suppliers, inventory, transport, utilities.",
    tone: "peach",
  },
  {
    icon: CalendarClock,
    name: "Obligations Reserve",
    pct: "25%",
    body: "Reserved before they bite — payroll, rent, loans, utility bills, taxes.",
    tone: "peach-soft",
  },
  {
    icon: ShieldCheck,
    name: "Profit Reserve",
    pct: "10%",
    body: "Your business cushion. Survives a bad week, funds the next move.",
    tone: "prussian",
  },
  {
    icon: Coins,
    name: "Owner Salary",
    pct: "10%",
    body: "Pay yourself like an employee. Stable. Predictable. Disciplined.",
    tone: "prussian-soft",
  },
  {
    icon: Sprout,
    name: "Growth & Investment",
    pct: "Flex",
    body: "When the numbers permit — new equipment, new market, new hires.",
    tone: "ink",
  },
] as const;

const toneStyles: Record<(typeof buckets)[number]["tone"], string> = {
  peach: "bg-[#F27344] text-white",
  "peach-soft": "bg-peach-100 text-[#B14A24]",
  prussian: "bg-[#0F172A] text-white",
  "prussian-soft": "bg-prussian-100 text-[#0F172A]",
  ink: "bg-ink-300 text-white",
};

export function SmartBuckets() {
  return (
    <section id="for-smes" className="relative isolate overflow-hidden bg-[#F8FAFC]">
      <div aria-hidden className="hue-blue" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-24">
            <Image
              src="/assets/clipart4.png"
              alt=""
              width={500}
              height={500}
              className="mb-5 h-auto w-60 sm:w-72"
              aria-hidden
            />
            <span className="inline-flex items-center gap-2 rounded-full bg-snow-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-100">
              Smart reserve buckets
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink-300 sm:text-4xl">
              One bank account. <br />
              <span className="text-[#F27344]">Five disciplined intentions.</span>
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-ink-100 sm:text-lg">
              SoleBook doesn&apos;t force you to open new accounts. Inside your
              existing balance, AI tracks five intent-based reserves — so every
              rupee already knows where it&apos;s going.
            </p>

            <div className="mt-7 rounded-2xl border border-snow-300 bg-white p-5 shadow-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-50">
                  Current account balance
                </span>
                <span className="text-xs text-ink-50">demo</span>
              </div>
              <div className="mt-1 text-3xl font-semibold tracking-tight text-ink-300">
                Rs 500,000
              </div>

              <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-snow-200">
                <span className="block h-full" style={{ width: "50%", backgroundColor: "#F27344" }} />
                <span className="block h-full" style={{ width: "24%", backgroundColor: "#FBA378" }} />
                <span className="block h-full" style={{ width: "16%", backgroundColor: "#1E365D" }} />
                <span className="block h-full" style={{ width: "10%", backgroundColor: "#93A2BB" }} />
              </div>
              <p className="mt-3 text-xs text-ink-100">
                Allocated across operations, obligations, reserve and owner
                salary — visible, but never locked away.
              </p>
            </div>
          </div>

          <ul className="space-y-3.5">
            {buckets.map((b) => (
              <li
                key={b.name}
                className="group flex gap-4 rounded-2xl border border-snow-300 bg-white p-5 transition hover:border-[#F27344]/30 hover:shadow-sm"
              >
                <span
                  className={`inline-flex size-12 shrink-0 items-center justify-center rounded-xl ${toneStyles[b.tone]}`}
                >
                  <b.icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-ink-300">
                      {b.name}
                    </h3>
                    <span className="rounded-md bg-snow-200 px-2 py-0.5 text-xs font-semibold text-ink-200">
                      {b.pct}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-100">
                    {b.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
