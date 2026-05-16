"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn, formatShortCurrency, getDaysUntil } from "@/lib/utils";

const TONE_CLASS: Record<"danger" | "warning" | "success", string> = {
  danger: "text-[#B91C1C]",
  warning: "text-[#B45309]",
  success: "text-[#15803D]",
};

function getTone(daysUntil: number) {
  if (daysUntil <= 3) return "danger" as const;
  if (daysUntil <= 7) return "warning" as const;
  return "success" as const;
}

export function UpcomingPayments() {
  const { obligations } = useAppData();
  const { t } = useLocale();

  const upcoming = obligations
    .filter((o) => o.status === "pending")
    .sort(
      (a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )
    .slice(0, 5);
  const urgent = upcoming.filter((o) => getDaysUntil(o.dueDate) <= 7).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-peach-700">
            {t.dashboard.upcoming.eyebrow}
          </p>
          <CardTitle className="mt-1.5">
            {t.dashboard.upcoming.title}
          </CardTitle>
          <p className="mt-1 text-xs text-ink-50">
            {t.dashboard.upcoming.sub.replace(
              "{{count}}",
              String(upcoming.length),
            )}
          </p>
        </div>
        <Badge variant="danger" className="shrink-0">
          {t.dashboard.upcoming.urgent.replace("{{n}}", String(urgent))}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-snow-200">
          {upcoming.map((o) => {
            const days = getDaysUntil(o.dueDate);
            const tone = getTone(days);
            const dayLabel =
              days === 0
                ? t.dashboard.upcoming.today
                : days === 1
                  ? t.dashboard.upcoming.tomorrow
                  : t.dashboard.upcoming.dueIn.replace(
                      "{{days}}",
                      String(days),
                    );
            return (
              <li
                key={o.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-snow-100 transition-colors"
              >
                <div
                  className={cn(
                    "flex size-11 flex-col items-center justify-center rounded-xl border text-[11px] font-semibold",
                    tone === "danger"
                      ? "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
                      : tone === "warning"
                        ? "border-[#FEF3C7] bg-[#FFFBEB] text-[#B45309]"
                        : "border-[#D1FAE5] bg-[#ECFDF5] text-[#15803D]",
                  )}
                  aria-hidden
                >
                  <span className="text-[10px] uppercase">
                    {format(parseISO(o.dueDate), "MMM")}
                  </span>
                  <span className="text-base font-bold leading-none">
                    {format(parseISO(o.dueDate), "d")}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-300 truncate">
                    {o.name}
                  </p>
                  <p className="text-xs text-ink-50">
                    {o.category} ·{" "}
                    <span className={TONE_CLASS[tone]}>{dayLabel}</span>
                  </p>
                </div>
                <p className="text-sm font-bold text-ink-300 shrink-0">
                  {formatShortCurrency(o.amount)}
                </p>
              </li>
            );
          })}
        </ul>
        <Link
          href="/obligations"
          className="flex items-center justify-between border-t border-snow-300 px-5 py-3 text-sm font-medium text-peach-700 hover:bg-peach-50 transition-colors"
        >
          <span>{t.common.viewAll}</span>
          <ChevronRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
