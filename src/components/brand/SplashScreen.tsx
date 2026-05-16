"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Phase = "logo" | "tagline" | "exit" | "done";

interface SplashScreenProps {
  /** Time the splash stays fully visible before fading out (ms). */
  holdMs?: number;
  /** Delay between logo appearing and tagline appearing (ms). */
  taglineDelayMs?: number;
  /** Fade-out duration (ms). */
  exitMs?: number;
}

export function SplashScreen({
  holdMs = 2400,
  taglineDelayMs = 700,
  exitMs = 600,
}: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>("logo");

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const taglineAt = reduce ? 0 : taglineDelayMs;
    const exitAt = reduce ? 900 : holdMs;
    const doneAt = reduce ? 1100 : holdMs + exitMs;

    const t1 = window.setTimeout(() => setPhase("tagline"), taglineAt);
    const t2 = window.setTimeout(() => setPhase("exit"), exitAt);
    const t3 = window.setTimeout(() => setPhase("done"), doneAt);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [holdMs, taglineDelayMs, exitMs]);

  // Lock background scroll only while the splash overlay is actually on screen.
  // Restoring this in the useEffect cleanup above is unreliable because the
  // component never unmounts — it just renders null when phase === "done".
  useEffect(() => {
    if (phase === "done") return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [phase]);

  if (phase === "done") return null;

  const isExiting = phase === "exit";
  const showTagline = phase === "tagline" || phase === "exit";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="SoleBook is loading"
      className={`fixed inset-0 z-100 flex items-center justify-center overflow-hidden bg-[#F27344] transition-opacity ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${exitMs}ms` }}
    >
      {/* Warm gradient wash (peach-700 -> peach-800) for depth on the burnt-orange surface */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#B14A24_0%,#9A3F1F_55%,#823516_100%)]"
      />
      {/* Duotone ambient: a deep peach-900 wash on one side, a cream highlight on the other */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(closest-side at 18% 28%, rgba(79,31,10,0.45), transparent 60%), radial-gradient(closest-side at 82% 78%, rgba(255,243,236,0.18), transparent 65%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="bg-dot-grid-dark pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black_35%,transparent_75%)]"
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div
          className="animate-splash-logo overflow-hidden rounded-[28px] ring-1 ring-white/15"
          style={{
            boxShadow:
              "0 30px 80px -30px rgba(79,31,10,0.55), 0 12px 32px -12px rgba(15,23,42,0.35)",
          }}
        >
          <Image
            src="/assets/logo.jpg"
            alt="SoleBook logo"
            width={679}
            height={555}
            priority
            className="block h-auto w-64 sm:w-72"
          />
        </div>

        <p
          className={`mt-7 text-balance text-base font-medium tracking-[-0.005em] text-peach-50 sm:text-lg ${
            showTagline ? "animate-splash-tagline" : "opacity-0"
          }`}
        >
          Financial Discipline,{" "}
          <span className="font-semibold text-white">Automated.</span>
        </p>
      </div>
    </div>
  );
}
