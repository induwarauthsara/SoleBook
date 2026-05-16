import {
  AlertOctagon,
  Bell,
  Brain,
  Copy,
  Languages,
  LineChart,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Cash Allocation",
    body:
      "Dynamic, explainable splits based on your business type, obligations, and recent cash behavior — never fixed ratios.",
  },
  {
    icon: ListChecks,
    title: "Priority Payment Engine",
    body:
      "Salaries, utilities, loans first. Suppliers next. Optional spending last. SoleBook tells you what must be paid this week.",
  },
  {
    icon: Bell,
    title: "Obligation Forecast",
    body:
      "See 7, 14 and 30-day risks before they happen. Cheque dates, supplier dues, recurring bills — all visible early.",
  },
  {
    icon: LineChart,
    title: "Financial Discipline Score",
    body:
      "A gamified business health score that grows when you pay on time, reserve consistently, and pay yourself stably.",
  },
  {
    icon: Copy,
    title: "Duplicate Payment Detection",
    body:
      "Caught a supplier transfer that looks like one made 3 days ago? SoleBook flags it before the rupees leave your account.",
  },
  {
    icon: AlertOctagon,
    title: "Risk & Fraud Signals",
    body:
      "Large transfers to new payees, unusual hours, abnormal velocity — surfaced as plain-language warnings, not jargon.",
  },
  {
    icon: ShieldCheck,
    title: "Owner Salary System",
    body:
      "Pay yourself like an employee. Track withdrawals against your salary goal and see leakage before it hurts payroll.",
  },
  {
    icon: Languages,
    title: "Sinhala · Tamil · English",
    body:
      "Local language insights you can actually understand. No accounting jargon, no Western fintech tone.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-peach-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#B14A24]">
            <Sparkles className="size-3.5" aria-hidden />
            Everything you need, nothing you don&apos;t
          </span>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink-300 sm:text-4xl">
            A focused financial OS — built for sole proprietors.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-100 sm:text-lg">
            Not accounting. Not ERP. Not another expense tracker. SoleBook is
            the discipline layer above all of them.
          </p>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <li
              key={f.title}
              className="group rounded-2xl border border-snow-300 bg-[#F8FAFC] p-5 transition hover:-translate-y-1 hover:border-[#F27344]/30 hover:bg-white hover:shadow-md"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-[#F27344] ring-1 ring-snow-300 transition group-hover:bg-[#F27344] group-hover:text-white group-hover:ring-transparent">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-300">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-100">{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
