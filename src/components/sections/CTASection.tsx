"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

type Status = "idle" | "loading" | "ok" | "duplicate" | "error";

export function CTASection() {
  const { t, locale } = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, language: locale, source: "landing-cta" }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        duplicate?: boolean;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error || t.waitlist.error);
        return;
      }
      if (data.duplicate) {
        setStatus("duplicate");
        setMessage(t.waitlist.already);
      } else {
        setStatus("ok");
        setMessage(t.waitlist.success);
      }
      setEmail("");
    } catch {
      setStatus("error");
      setMessage(t.waitlist.error);
    }
  }

  const done = status === "ok" || status === "duplicate";

  return (
    <section
      id="waitlist"
      className="relative isolate overflow-hidden bg-[#F8FAFC]"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="relative isolate overflow-hidden rounded-3xl bg-[#0F172A] px-6 py-14 sm:px-10 sm:py-20 lg:px-16">
          <div aria-hidden className="hue-duotone-dark absolute inset-0" />
          <div
            aria-hidden
            className="bg-dot-grid-dark pointer-events-none absolute inset-0 z-[1] opacity-50"
          />

          <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[44px] lg:leading-[1.1]">
                Run your business <br />
                <span className="text-[#F27344]">like it&apos;s meant to grow.</span>
              </h2>
              <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-snow-200 sm:text-lg">
                Join the SoleBook pilot. Bring your bank, your business and
                your goals — leave the cash chaos behind.
              </p>
            </div>

            <form
              onSubmit={onSubmit}
              className="glass-dark rounded-2xl p-4 shadow-xl sm:p-5"
            >
              <label
                htmlFor="cta-email"
                className="block text-xs font-medium uppercase tracking-wider text-snow-500"
              >
                {t.nav.getStarted}
              </label>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="cta-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.waitlist.placeholder}
                  disabled={status === "loading" || done}
                  className="flex-1 rounded-full border border-white/10 bg-[#0F172A] px-4 py-3 text-sm text-white placeholder:text-snow-500 focus:border-[#F27344] focus:outline-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={status === "loading" || done}
                  className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-[#F27344] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#D45F33] disabled:opacity-70"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      …
                    </>
                  ) : done ? (
                    <>
                      <CheckCircle2 className="size-4" aria-hidden />
                      Joined
                    </>
                  ) : (
                    <>
                      {t.waitlist.button}
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </>
                  )}
                </button>
              </div>

              <p
                className={`mt-3 min-h-[1.25rem] text-xs ${
                  status === "error"
                    ? "text-[#F27344]"
                    : done
                      ? "text-snow-200"
                      : "text-snow-500"
                }`}
                role="status"
                aria-live="polite"
              >
                {message ||
                  "No spam. Unsubscribe any time. Sinhala · Tamil · English available."}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
