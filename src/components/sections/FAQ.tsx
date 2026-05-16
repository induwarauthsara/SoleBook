"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is SoleBook a bank?",
    a: "No. SoleBook is a financial discipline layer that works on top of your existing bank account. We never hold your money — we just help you manage it more intentionally.",
  },
  {
    q: "Does SoleBook move money on its own?",
    a: "No. AI only recommends — you approve. Every allocation, every payment, every withdrawal stays under your control. Sensitive financial logic runs on deterministic rules, not a black-box model.",
  },
  {
    q: "Do I need to open new bank accounts?",
    a: "No. The five reserves (Operations, Obligations, Profit Reserve, Owner Salary, Growth) are intelligent virtual allocations inside the bank balance you already have.",
  },
  {
    q: "Will this replace my accountant or ERP?",
    a: "No. SoleBook is not accounting software or an ERP. It connects to them when needed and focuses on one job — keeping your cash disciplined.",
  },
  {
    q: "Is my financial data safe?",
    a: "Yes. We minimise what leaves your business, sanitize sensitive fields before AI sees them, and use bank-grade transport security. Audit logs capture every important event.",
  },
  {
    q: "Which languages does SoleBook support?",
    a: "English, Sinhala, and Tamil. You can switch language any time from the header.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative isolate overflow-hidden bg-white">
      <div aria-hidden className="hue-blue" />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink-300 sm:text-4xl">
            Questions, answered plainly.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-100 sm:text-lg">
            No jargon. No fine print. Just what you&apos;d ask over tea.
          </p>
        </div>

        <ul className="mt-12 space-y-3">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <li
                key={item.q}
                className={`overflow-hidden rounded-2xl border transition ${
                  isOpen
                    ? "border-[#F27344]/40 bg-peach-50/30"
                    : "border-snow-300 bg-white hover:border-snow-400"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[15px] font-semibold text-ink-300 sm:text-base">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-ink-100 transition-transform ${
                      isOpen ? "rotate-180 text-[#F27344]" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-ink-100 sm:text-[15px]">
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
