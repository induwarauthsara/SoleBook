import { ArrowRight, Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "during pilot",
    blurb: "For sole proprietors getting started with discipline.",
    cta: "Get early access",
    href: "#waitlist",
    featured: false,
    features: [
      "AI cash allocation engine",
      "Up to 200 transactions / month",
      "Owner salary tracking",
      "Discipline score",
      "Sinhala · Tamil · English",
    ],
  },
  {
    name: "Growth",
    price: "Rs 1,490",
    period: "/ month",
    blurb: "For shops, pharmacies and restaurants ready to grow.",
    cta: "Join the pilot",
    href: "#waitlist",
    featured: true,
    features: [
      "Everything in Starter",
      "Unlimited transactions",
      "Obligation forecast (7 / 14 / 30 days)",
      "Duplicate & fraud detection",
      "AI assistant (Sinhala · Tamil · English)",
      "Priority email support",
    ],
  },
  {
    name: "Business",
    price: "Custom",
    period: "talk to us",
    blurb: "For multi-branch SMEs and ERP / POS integration.",
    cta: "Talk to sales",
    href: "#waitlist",
    featured: false,
    features: [
      "Everything in Growth",
      "ERP / POS integration",
      "Multi-branch reserve tracking",
      "Loan readiness reports",
      "Dedicated onboarding",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-snow-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-100">
            Pricing
          </span>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink-300 sm:text-4xl">
            Simple pricing, made for SMEs.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-100 sm:text-lg">
            Try SoleBook free during the pilot. Pay only when it&apos;s actually
            making your business calmer.
          </p>
        </div>

        <ul className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((p) => (
            <li
              key={p.name}
              className={`relative flex h-full flex-col rounded-3xl border p-7 transition ${
                p.featured
                  ? "border-transparent bg-[#0F172A] text-white shadow-xl"
                  : "border-snow-300 bg-white text-ink-300 hover:border-[#F27344]/30 hover:shadow-md"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#F27344] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  <Sparkles className="size-3" aria-hidden />
                  Most popular
                </span>
              )}

              <div>
                <h3
                  className={`text-base font-semibold ${
                    p.featured ? "text-white" : "text-ink-300"
                  }`}
                >
                  {p.name}
                </h3>
                <p
                  className={`mt-1 text-sm ${
                    p.featured ? "text-snow-200" : "text-ink-100"
                  }`}
                >
                  {p.blurb}
                </p>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <span
                  className={`text-3xl font-semibold tracking-tight ${
                    p.featured ? "text-white" : "text-ink-300"
                  }`}
                >
                  {p.price}
                </span>
                <span
                  className={`text-sm ${
                    p.featured ? "text-snow-200" : "text-ink-100"
                  }`}
                >
                  {p.period}
                </span>
              </div>

              <ul
                className={`mt-6 flex-1 space-y-2.5 text-sm ${
                  p.featured ? "text-snow-100" : "text-ink-200"
                }`}
              >
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      className={`mt-0.5 size-4 shrink-0 ${
                        p.featured ? "text-[#F27344]" : "text-[#F27344]"
                      }`}
                      aria-hidden
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={p.href}
                className={`mt-7 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  p.featured
                    ? "bg-[#F27344] text-white hover:bg-[#D45F33]"
                    : "border border-snow-300 bg-white text-ink-300 hover:bg-snow-100"
                }`}
              >
                {p.cta}
                <ArrowRight className="size-4" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
