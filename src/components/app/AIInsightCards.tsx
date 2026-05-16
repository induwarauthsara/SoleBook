"use client";

import {
  AlertTriangle,
  Lightbulb,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import type { AIInsight, InsightSeverity } from "@/types/app";

const styleMap: Record<
  InsightSeverity,
  {
    icon: LucideIcon;
    badge: "danger" | "warning" | "info" | "success";
    accent: string;
    ring: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    badge: "danger",
    accent: "text-[#B91C1C]",
    ring: "ring-[#FECACA]",
  },
  warning: {
    icon: Lightbulb,
    badge: "warning",
    accent: "text-[#B45309]",
    ring: "ring-[#FEF3C7]",
  },
  info: {
    icon: Sparkles,
    badge: "info",
    accent: "text-[#1D4ED8]",
    ring: "ring-[#DBEAFE]",
  },
  positive: {
    icon: TrendingUp,
    badge: "success",
    accent: "text-[#15803D]",
    ring: "ring-[#D1FAE5]",
  },
};

interface AIInsightCardsProps {
  limit?: number;
}

export function AIInsightCards({ limit = 4 }: AIInsightCardsProps) {
  const { insights } = useAppData();
  const { t } = useLocale();

  const visible = insights.slice(0, limit);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-peach-700">
            {t.insights.title}
          </p>
          <h3 className="mt-1.5 text-lg font-semibold text-ink-300">
            {t.insights.sub}
          </h3>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const style = styleMap[insight.severity];
  const Icon = style.icon;
  return (
    <Card padded className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-xl bg-snow-100 ring-1",
            style.ring,
          )}
        >
          <Icon className={cn("size-4", style.accent)} />
        </span>
        <Badge variant={style.badge}>{insight.category}</Badge>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-300">{insight.message}</p>
        {insight.detail && (
          <p className="mt-1 text-xs text-ink-100 leading-relaxed">
            {insight.detail}
          </p>
        )}
      </div>
      {insight.action && (
        <button
          type="button"
          className={cn(
            "mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-snow-100 px-3 py-1.5 text-xs font-semibold hover:bg-snow-200 transition-colors",
            style.accent,
          )}
        >
          {insight.action}
        </button>
      )}
    </Card>
  );
}
