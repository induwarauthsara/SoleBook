import {
  AlertTriangle,
  Brain,
  MessageCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const insights = [
  {
    tone: "warn",
    icon: AlertTriangle,
    label: "Cash flow risk",
    text: "Supplier payments may fail in 9 days if current spending continues.",
  },
  {
    tone: "info",
    icon: TrendingUp,
    label: "Reserve health",
    text: "Inventory spending up 12% — but profit reserve dropped 40%. Worth a look.",
  },
  {
    tone: "owner",
    icon: TrendingDown,
    label: "Owner withdrawals",
    text: "Withdrawals exceeded your salary goal by 22% this month — may affect payroll.",
  },
] as const;

const toneStyles: Record<(typeof insights)[number]["tone"], string> = {
  warn: "border-[#F27344]/30 bg-peach-50",
  info: "border-prussian-100 bg-prussian-50/60",
  owner: "border-snow-300 bg-white",
};
const toneIconStyles: Record<(typeof insights)[number]["tone"], string> = {
  warn: "bg-[#F27344] text-white",
  info: "bg-[#0F172A] text-white",
  owner: "bg-ink-300 text-white",
};

export function AIInsights() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0F172A]">
      <div
        aria-hidden
        className="bg-dot-grid-dark pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-[#F27344]/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-snow-100">
              <Brain className="size-3.5 text-[#F27344]" aria-hidden />
              Plain-language AI
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              AI that speaks like a careful accountant — not a black box.
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-snow-200 sm:text-lg">
              SoleBook&apos;s AI explains every recommendation in the language of
              your shop, not your bank. It suggests, you decide. Sensitive
              financial logic stays inside a deterministic engine — the AI is
              there to make it understandable.
            </p>

            <ul className="mt-7 space-y-2 text-sm text-snow-200">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#F27344]" />
                AI never moves money on its own.
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#F27344]" />
                Sensitive data is sanitized before reaching any model.
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#F27344]" />
                Every recommendation has a reason you can audit.
              </li>
            </ul>
          </div>

          <div className="space-y-3.5">
            {insights.map((c) => (
              <div
                key={c.label}
                className={`rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${toneStyles[c.tone]}`}
              >
                <div className="flex gap-3">
                  <span
                    className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${toneIconStyles[c.tone]}`}
                  >
                    <c.icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-100">
                      {c.label}
                    </div>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-300">
                      {c.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Chat-style snippet */}
            <div className="rounded-2xl border border-white/10 bg-[#1E293B] p-4 text-snow-100 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-snow-500">
                <MessageCircle className="size-3.5 text-[#F27344]" aria-hidden />
                Ask SoleBook
              </div>
              <p className="mt-2 text-sm text-snow-200">
                <span className="text-snow-500">You · </span> Can I safely pay
                this supplier today?
              </p>
              <p className="mt-1.5 text-sm">
                <span className="text-[#F27344]">SoleBook · </span> Yes, but
                only Rs 60,000 of the Rs 90,000 invoice. The rest would push
                your obligations reserve below the staff salary due Friday.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
