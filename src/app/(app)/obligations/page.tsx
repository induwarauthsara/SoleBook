"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn, formatShortCurrency, getDaysUntil } from "@/lib/utils";
import type { Obligation } from "@/types/app";

type Tab = "all" | "suppliers" | "utilities" | "staff";

export default function ObligationsPage() {
  const { obligations } = useAppData();
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("all");
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

  const handleMarkPaid = (id: string) => {
    setPaidIds((prev) => new Set(prev).add(id));
  };

  const filter = (o: Obligation) => {
    if (tab === "all") return true;
    return o.group === tab;
  };

  const filtered = obligations
    .filter(filter)
    .sort(
      (a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-ink-300">{t.obligations.title}</h2>
        <p className="text-sm text-ink-50">{t.obligations.sub}</p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="all">{t.obligations.tabs.all}</TabsTrigger>
          <TabsTrigger value="suppliers">{t.obligations.tabs.suppliers}</TabsTrigger>
          <TabsTrigger value="utilities">{t.obligations.tabs.utilities}</TabsTrigger>
          <TabsTrigger value="staff">{t.obligations.tabs.staff}</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {tab === "all"
                  ? `${filtered.length} obligations`
                  : t.obligations.tabs[tab]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-snow-200">
                {filtered.map((o) => (
                  <ObligationRow
                    key={o.id}
                    obligation={o}
                    markedPaid={paidIds.has(o.id)}
                    onMarkPaid={handleMarkPaid}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ObligationRow({
  obligation,
  markedPaid,
  onMarkPaid,
}: {
  obligation: Obligation;
  markedPaid: boolean;
  onMarkPaid: (id: string) => void;
}) {
  const { t } = useLocale();
  const days = getDaysUntil(obligation.dueDate);
  const isPaid = obligation.status === "paid" || markedPaid;
  const tone = isPaid
    ? "success"
    : days <= 3
      ? "danger"
      : days <= 7
        ? "warning"
        : "success";
  const dateLabel = format(parseISO(obligation.dueDate), "MMM d");

  return (
    <li className={cn(
      "flex flex-wrap items-center gap-3 px-5 py-4 transition-colors",
      isPaid ? "bg-[#F0FDF4]/60 opacity-75" : "hover:bg-snow-100",
    )}>
      <div
        className={cn(
          "flex size-11 flex-col items-center justify-center rounded-xl border text-[11px] font-semibold",
          tone === "danger"
            ? "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
            : tone === "warning"
              ? "border-[#FEF3C7] bg-[#FFFBEB] text-[#B45309]"
              : "border-[#D1FAE5] bg-[#ECFDF5] text-[#15803D]",
        )}
      >
        <span className="text-[10px] uppercase">
          {format(parseISO(obligation.dueDate), "MMM")}
        </span>
        <span className="text-base font-bold leading-none">
          {format(parseISO(obligation.dueDate), "d")}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold truncate", isPaid ? "text-ink-50 line-through" : "text-ink-300")}>
          {obligation.name}
        </p>
        <p className="text-xs text-ink-50">
          {obligation.category} · {dateLabel}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant={
            obligation.priority === "HIGH"
              ? "high"
              : obligation.priority === "MEDIUM"
                ? "medium"
                : "low"
          }
        >
          {t.obligations.priority[obligation.priority]}
        </Badge>
        <Badge
          variant={isPaid ? "success" : obligation.status === "overdue" ? "danger" : "secondary"}
        >
          {isPaid ? t.obligations.status.paid : t.obligations.status[obligation.status]}
        </Badge>
      </div>

      <p className="w-full sm:w-auto text-right text-sm font-bold text-ink-300">
        {formatShortCurrency(obligation.amount)}
      </p>

      {isPaid ? (
        <span className="ml-auto sm:ml-0 inline-flex items-center gap-1 text-xs font-medium text-[#15803D]">
          <Check className="size-3.5" /> {t.obligations.status.paid}
        </span>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="ml-auto sm:ml-0"
          onClick={() => onMarkPaid(obligation.id)}
        >
          {t.common.markPaid}
        </Button>
      )}
    </li>
  );
}
