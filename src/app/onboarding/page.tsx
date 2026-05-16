"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShoppingBag,
  UtensilsCrossed,
  Briefcase,
  Package,
  Globe,
  Laptop,
  Building2,
  Landmark,
  Sparkles,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localeMeta, type Locale } from "@/lib/i18n";
import { cn, formatShortCurrency } from "@/lib/utils";
import type { BusinessType, OnboardingState } from "@/types/app";

type Step =
  | "language"
  | "welcome"
  | "profile"
  | "business"
  | "connect"
  | "saving"
  | "done";

const STEP_ORDER: Step[] = [
  "language",
  "welcome",
  "profile",
  "business",
  "connect",
  "saving",
  "done",
];

const STORAGE_KEY = "solebook.onboarding";

const BUSINESS_TYPES: { id: BusinessType; icon: LucideIcon }[] = [
  { id: "retail", icon: ShoppingBag },
  { id: "restaurant", icon: UtensilsCrossed },
  { id: "services", icon: Briefcase },
  { id: "wholesale", icon: Package },
  { id: "online", icon: Globe },
  { id: "freelancer", icon: Laptop },
  { id: "other", icon: Building2 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  const { user, signIn, updateUser, isHydrated, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>("language");
  const [state, setState] = useState<OnboardingState>(() => {
    const fallback: OnboardingState = {
      step: 0,
      ownerName: user?.name ?? "",
      businessName: "",
      businessType: null,
      businessTypeOther: "",
      accountConnected: false,
      savingGoal: 50000,
      done: false,
    };
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const idx = STEP_ORDER.indexOf(step);
  const total = STEP_ORDER.length;
  const progress = Math.round(((idx + 1) / total) * 100);

  const goTo = (next: Step) => setStep(next);
  const goNext = () => {
    const nextIdx = Math.min(idx + 1, STEP_ORDER.length - 1);
    setStep(STEP_ORDER[nextIdx]);
  };
  const goBack = () => {
    const prevIdx = Math.max(idx - 1, 0);
    setStep(STEP_ORDER[prevIdx]);
  };

  const finish = () => {
    updateUser({
      name: state.ownerName || user?.name || "Owner",
    });
    try {
      window.localStorage.setItem("solebook.onboarded", "true");
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-dvh bg-snow-100">
      <div className="hue-orange pointer-events-none absolute inset-0 opacity-25" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <Logo />
          <p className="text-xs text-ink-50">
            {t.onboarding.progress
              .replace("{{step}}", String(idx + 1))
              .replace("{{total}}", String(total))}
          </p>
        </header>
        <Progress value={progress} className="mt-4 h-1.5" />

        <div className="mt-6 flex-1">
          {step === "language" && (
            <Card padded>
              <h2 className="text-2xl font-bold text-ink-300">
                {t.onboarding.language.title}
              </h2>
              <p className="mt-1 text-sm text-ink-50">
                {t.onboarding.language.sub}
              </p>
              <ul className="mt-5 space-y-2">
                {(Object.keys(localeMeta) as Locale[]).map((l) => {
                  const active = locale === l;
                  return (
                    <li key={l}>
                      <button
                        type="button"
                        onClick={() => setLocale(l)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl border px-4 py-3 transition-colors",
                          active
                            ? "border-peach-300 bg-peach-50"
                            : "border-snow-300 bg-white hover:bg-snow-100",
                        )}
                      >
                        <span className="flex flex-col text-left">
                          <span className="text-sm font-semibold text-ink-300">
                            {localeMeta[l].native}
                          </span>
                          <span className="text-xs text-ink-50">
                            {localeMeta[l].label}
                          </span>
                        </span>
                        {active && (
                          <Check className="size-5 text-peach-700" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {step === "welcome" && (
            <Card padded>
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-peach-700">
                <Sparkles className="size-3.5" /> {t.onboarding.welcome.title}
              </span>
              <h2 className="mt-2 text-2xl font-bold text-ink-300">
                {t.onboarding.welcome.title}
              </h2>
              <p className="mt-1 text-sm text-ink-100">
                {t.onboarding.welcome.sub}
              </p>
              <div className="mt-5 space-y-3">
                {t.onboarding.welcome.slides.map((slide) => (
                  <div
                    key={slide.title}
                    className="rounded-2xl border border-snow-300 bg-snow-100 p-4"
                  >
                    <p className="text-sm font-semibold text-ink-300">
                      {slide.title}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-100">{slide.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => goNext()}
                >
                  {t.onboarding.welcome.createAccount}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    signIn();
                    finish();
                  }}
                >
                  {t.onboarding.welcome.tryDemo}
                </Button>
              </div>
            </Card>
          )}

          {step === "profile" && (
            <Card padded>
              <h2 className="text-2xl font-bold text-ink-300">
                {t.onboarding.profile.title}
              </h2>
              <p className="mt-1 text-sm text-ink-50">
                {t.onboarding.profile.sub}
              </p>
              <div className="mt-5 space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-ink-100">
                    {t.onboarding.profile.ownerLabel}
                  </span>
                  <Input
                    value={state.ownerName}
                    onChange={(e) =>
                      setState((s) => ({ ...s, ownerName: e.target.value }))
                    }
                    placeholder="Nimal Perera"
                    className="mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-100">
                    {t.onboarding.profile.businessLabel}
                  </span>
                  <Input
                    value={state.businessName}
                    onChange={(e) =>
                      setState((s) => ({ ...s, businessName: e.target.value }))
                    }
                    placeholder="Nila Mini Mart"
                    className="mt-1"
                  />
                </label>
              </div>
            </Card>
          )}

          {step === "business" && (
            <Card padded>
              <h2 className="text-2xl font-bold text-ink-300">
                {t.onboarding.business.title}
              </h2>
              <p className="mt-1 text-sm text-ink-50">
                {t.onboarding.business.sub}
              </p>
              <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUSINESS_TYPES.map(({ id, icon: Icon }) => {
                  const active = state.businessType === id;
                  const types = t.onboarding.business.types as Record<
                    string,
                    string
                  >;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() =>
                          setState((s) => ({ ...s, businessType: id }))
                        }
                        className={cn(
                          "flex h-full w-full flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-colors",
                          active
                            ? "border-peach-300 bg-peach-50"
                            : "border-snow-300 bg-white hover:bg-snow-100",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-xl",
                            active
                              ? "bg-peach-500 text-white"
                              : "bg-snow-200 text-ink-100",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="text-sm font-semibold text-ink-300">
                          {types[id]}
                        </span>
                        <span className="text-[11px] text-ink-50 line-clamp-2">
                          {types[`${id}Desc`]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {state.businessType === "other" && (
                <label className="mt-3 block">
                  <span className="text-xs font-medium text-ink-100">
                    {t.onboarding.business.specify}
                  </span>
                  <Input
                    value={state.businessTypeOther ?? ""}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        businessTypeOther: e.target.value,
                      }))
                    }
                    placeholder="e.g. Auto parts"
                    className="mt-1"
                  />
                </label>
              )}
            </Card>
          )}

          {step === "connect" && (
            <Card padded>
              <h2 className="text-2xl font-bold text-ink-300">
                {t.onboarding.connect.title}
              </h2>
              <p className="mt-1 text-sm text-ink-100">
                {t.onboarding.connect.sub}
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3">
                {["Commercial Bank", "Sampath Bank", "HNB", "BoC"].map(
                  (bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() =>
                        setState((s) => ({ ...s, accountConnected: true }))
                      }
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors",
                        state.accountConnected
                          ? "border-peach-300 bg-peach-50"
                          : "border-snow-300 bg-white hover:bg-snow-100",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Landmark className="size-4 text-peach-700" />
                        <span className="font-medium text-ink-300">{bank}</span>
                      </span>
                      {state.accountConnected && (
                        <Check className="size-4 text-peach-700" />
                      )}
                    </button>
                  ),
                )}
              </div>
              <Button
                variant="ghost"
                className="mt-4 w-full"
                onClick={() => {
                  setState((s) => ({ ...s, accountConnected: false }));
                  goNext();
                }}
              >
                {t.onboarding.connect.skip}
              </Button>
            </Card>
          )}

          {step === "saving" && (
            <Card padded>
              <h2 className="text-2xl font-bold text-ink-300">
                {t.onboarding.saving.title}
              </h2>
              <p className="mt-1 text-sm text-ink-50">
                {t.onboarding.saving.sub}
              </p>
              <div className="mt-5 rounded-2xl border border-snow-300 bg-snow-100 p-4">
                <div className="flex items-end justify-between">
                  <p className="text-xs font-medium text-ink-100">
                    {t.onboarding.saving.label}
                  </p>
                  <p className="text-2xl font-bold text-ink-300">
                    {formatShortCurrency(state.savingGoal)}
                  </p>
                </div>
                <input
                  type="range"
                  min={0}
                  max={250000}
                  step={5000}
                  value={state.savingGoal}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      savingGoal: Number(e.target.value),
                    }))
                  }
                  className="mt-3 w-full accent-peach-500"
                />
                <div className="mt-1 flex justify-between text-[11px] text-ink-50">
                  <span>Rs. 0</span>
                  <span>Rs. 250K</span>
                </div>
              </div>
            </Card>
          )}

          {step === "done" && (
            <Card padded className="text-center">
              <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-peach-50 text-peach-700">
                <CircleDollarSign className="size-7" />
              </span>
              <h2 className="mt-4 text-2xl font-bold text-ink-300">
                {t.onboarding.done.title}
              </h2>
              <p className="mt-1 text-sm text-ink-100">
                {t.onboarding.done.sub}
              </p>
              <Button size="lg" className="mt-5 w-full" onClick={finish}>
                {t.onboarding.done.cta}
                <ArrowRight className="size-4" />
              </Button>
            </Card>
          )}
        </div>

        <footer className="mt-6 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            disabled={idx === 0}
            onClick={goBack}
            className="text-ink-100"
          >
            <ArrowLeft className="size-4" />
            {t.common.back}
          </Button>

          {step !== "done" && step !== "welcome" && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => goTo(STEP_ORDER[Math.min(idx + 1, total - 1)])}
              >
                {t.common.skip}
              </Button>
              <Button onClick={goNext}>
                {t.common.next}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
