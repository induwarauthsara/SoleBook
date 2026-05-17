"use client";

import Link from "next/link";
import { Activity, Clock, Sparkles, ArrowLeftRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  formatShortCurrency,
  getScoreColor,
  getScoreLabel,
} from "@/lib/utils";

export function DashboardHero() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { business, metrics, score } = useAppData();

  return (
    <Card className="relative overflow-hidden p-6 sm:p-7">
      <div className="absolute inset-x-8 top-0 h-px peach-rule-light" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-peach-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -bottom-24 size-72 rounded-full bg-prussian-500/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-peach-700">
              {t.dashboard.controlRoom}
            </p>
            <Link href="/allocation" className="lg:hidden">
              <Button size="sm">
                <ArrowLeftRight className="size-3.5" />
                {t.allocation.title}
              </Button>
            </Link>
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-ink-300 tracking-tight">
            {t.dashboard.greeting}, {user?.name?.split(" ")[0] ?? "Owner"}.
          </h2>
          <p className="mt-1 text-sm text-ink-100">
            {business.name} · {t.dashboard.subtitle}
          </p>

          <div className="mt-5 grid grid-cols-2 sm:flex sm:items-end sm:gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-ink-50">
                {t.dashboard.balance}
              </p>
              <p className="mt-1 text-2xl font-bold font-heading text-ink-300">
                {formatShortCurrency(metrics.currentBalance)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-ink-50">
                {t.dashboard.duePayments}
              </p>
              <p className="mt-1 text-2xl font-bold font-heading text-ink-300">
                {formatShortCurrency(metrics.pendingObligations)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <Link href="/allocation" className="hidden lg:block">
            <Button size="sm">
              <ArrowLeftRight className="size-3.5" />
              {t.allocation.title}
            </Button>
          </Link>
          <div className="grid grid-cols-3 gap-3 text-center">
          <Stat
            icon={<Activity className="size-3.5" />}
            label={t.dashboard.risk}
            value="Caution"
            tone="warning"
          />
          <Stat
            icon={<Clock className="size-3.5" />}
            label={t.dashboard.runway}
            value={
              metrics.cashRunway === null
                ? t.dashboard.runwayStable
                : `${metrics.cashRunway}d`
            }
            valueSub={
              metrics.cashRunway === null ? t.dashboard.runwayStableHint : undefined
            }
            tone="neutral"
          />
          <Stat
            icon={<Sparkles className="size-3.5" />}
            label={t.dashboard.score}
            value={`${score.overall}`}
            valueSub={getScoreLabel(score.overall)}
            tone="peach"
            valueColor={getScoreColor(score.overall)}
          />
          </div>
        </div>
      </div>
    </Card>
  );
}

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueSub?: string;
  tone: "warning" | "neutral" | "peach";
  valueColor?: string;
}

function Stat({ icon, label, value, valueSub, tone, valueColor }: StatProps) {
  const toneClass =
    tone === "warning"
      ? "border-[#F59E0B]/20 bg-[#F59E0B]/8"
      : tone === "peach"
        ? "border-peach-200 bg-peach-50"
        : "border-snow-300 bg-white";

  return (
    <div
      className={`rounded-2xl border ${toneClass} px-3 py-2.5 min-w-[88px]`}
    >
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-ink-50">
        {icon}
        <span>{label}</span>
      </div>
      <p
        className="mt-1 text-base font-bold font-heading"
        style={valueColor ? { color: valueColor } : { color: "#0F172A" }}
      >
        {value}
      </p>
      {valueSub && (
        <p className="text-[10px] text-ink-50 mt-0.5">{valueSub}</p>
      )}
    </div>
  );
}
