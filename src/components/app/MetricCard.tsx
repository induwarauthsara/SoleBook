"use client";

import { TrendingDown, TrendingUp, Minus, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  tone?: "peach" | "info" | "success" | "warning" | "danger";
}

const toneMap = {
  peach: { fg: "text-peach-700", bg: "bg-peach-50", ring: "ring-peach-100" },
  info: { fg: "text-[#1D4ED8]", bg: "bg-[#EFF6FF]", ring: "ring-[#DBEAFE]" },
  success: {
    fg: "text-[#15803D]",
    bg: "bg-[#ECFDF5]",
    ring: "ring-[#D1FAE5]",
  },
  warning: {
    fg: "text-[#B45309]",
    bg: "bg-[#FFFBEB]",
    ring: "ring-[#FEF3C7]",
  },
  danger: {
    fg: "text-[#B91C1C]",
    bg: "bg-[#FEF2F2]",
    ring: "ring-[#FECACA]",
  },
};

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  tone = "peach",
}: MetricCardProps) {
  const trendUp = change !== undefined && change >= 0;
  const TrendIcon =
    change === undefined ? Minus : trendUp ? TrendingUp : TrendingDown;
  const trendClass =
    change === undefined
      ? "text-ink-50"
      : trendUp
        ? "text-[#15803D]"
        : "text-[#B91C1C]";
  const t = toneMap[tone];

  return (
    <Card padded className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-xl ring-1",
            t.bg,
            t.ring,
          )}
        >
          <Icon className={cn("size-5", t.fg)} />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-snow-100 px-2 py-0.5 text-xs font-semibold",
              trendClass,
            )}
          >
            <TrendIcon className="size-3" />
            {Math.abs(change)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wider text-ink-50">
          {title}
        </p>
        <p className="mt-1.5 text-2xl font-bold font-heading text-ink-300">
          {value}
        </p>
        {changeLabel && (
          <p className="mt-0.5 text-xs text-ink-50">{changeLabel}</p>
        )}
      </div>
    </Card>
  );
}
