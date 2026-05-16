import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "I used to take money from the till whenever I needed it. Now I have a salary — and I finally know what my shop actually earns.",
    name: "Kamal Perera",
    role: "Grocery shop owner",
    city: "Nugegoda",
    initials: "KP",
  },
  {
    quote:
      "SoleBook warned me three weeks before the supplier deadline. Last year I would have missed it and lost the credit line.",
    name: "Niluka Fernando",
    role: "Pharmacy owner",
    city: "Kandy",
    initials: "NF",
  },
  {
    quote:
      "It speaks my language. Not bank language. Not accounting language. My language. That alone makes the discipline easier.",
    name: "Rajesh Kumar",
    role: "Restaurant owner",
    city: "Jaffna",
    initials: "RK",
  },
];

export function Testimonials() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink-300 sm:text-4xl">
            Built with shop owners, not for spreadsheets.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-100 sm:text-lg">
            We sat with grocers in Nugegoda, restaurants in Jaffna, and
            pharmacies in Kandy — and we built the calmest financial layer we
            could.
          </p>
        </div>

        <ul className="mt-14 grid gap-5 lg:grid-cols-3">
          {testimonials.map((t) => (
            <li
              key={t.name}
              className="flex h-full flex-col rounded-2xl border border-snow-300 bg-[#F8FAFC] p-6 transition hover:border-[#F27344]/30 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <Quote className="size-4 text-[#F27344]" aria-hidden />
                <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-3.5 fill-[#F27344] text-[#F27344]"
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-200">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-snow-300 pt-4">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#0F172A] text-xs font-semibold text-white">
                  {t.initials}
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-ink-300">
                    {t.name}
                  </div>
                  <div className="text-xs text-ink-100">
                    {t.role} · {t.city}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
