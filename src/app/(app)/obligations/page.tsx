"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Check, Download, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs";
import { AddObligationDialog } from "@/components/app/AddObligationDialog";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { messageFromApiBody, readJsonSafe } from "@/lib/api-error";
import { mapApiRowToObligation } from "@/lib/map-obligation";
import { cn, formatShortCurrency, getDaysUntil } from "@/lib/utils";
import type { Obligation } from "@/types/app";
import { mockPaymentGatewayHeaders } from "@/lib/dev/mock-payment-gateway";

type Tab = "all" | "suppliers" | "utilities" | "staff";

export default function ObligationsPage() {
  const { obligations: providerObligations, refresh } = useAppData();
  const providerRef = useRef(providerObligations);
  providerRef.current = providerObligations;

  const { session } = useAuth();
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("all");
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [payingId, setPayingId] = useState<string | null>(null);
  const [rows, setRows] = useState<Obligation[]>([]);
  const [listReady, setListReady] = useState(false);

  const loadObligations = useCallback(async () => {
    if (!session?.access_token) {
      setRows(providerRef.current);
      setListReady(true);
      return;
    }

    const res = await fetch("/api/obligations", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await readJsonSafe(res);

    if (!res.ok) {
      toast.info(t.obligations.loadError);
      setRows(providerRef.current);
      setListReady(true);
      return;
    }

    const raw = (data as { obligations?: unknown[] } | null)?.obligations;
    const mapped = Array.isArray(raw)
      ? raw.map((o) => mapApiRowToObligation(o as Record<string, unknown>))
      : [];
    setRows(mapped);
    setListReady(true);
  }, [session?.access_token, t.obligations.loadError]);

  useEffect(() => {
    setListReady(false);
    loadObligations().catch(() => {
      toast.info(t.obligations.loadError);
      setRows(providerRef.current);
      setListReady(true);
    });
  }, [loadObligations, t.obligations.loadError]);

  const handleMarkPaid = (id: string) => {
    setPaidIds((prev) => new Set(prev).add(id));
  };

  const handlePayFromBank = useCallback(
    async (id: string) => {
      if (!session?.access_token) {
        toast.error(t.obligations.bankPayNeedAuth);
        return;
      }
      setPayingId(id);
      try {
        const res = await fetch(`/api/obligations/${id}/pay`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            ...mockPaymentGatewayHeaders(),
          },
          body: JSON.stringify({}),
        });
        const data = await readJsonSafe(res);
        if (!res.ok) {
          toast.error(
            messageFromApiBody(data, t.obligations.bankPayError),
          );
          return;
        }
        toast.success(t.obligations.bankPaySuccess);
        await refresh();
        await loadObligations();
      } catch {
        toast.error(t.obligations.bankPayError);
      } finally {
        setPayingId(null);
      }
    },
    [
      session?.access_token,
      t.obligations.bankPayError,
      t.obligations.bankPayNeedAuth,
      t.obligations.bankPaySuccess,
      refresh,
      loadObligations,
    ],
  );

  const filter = (o: Obligation) => {
    if (tab === "all") return true;
    return o.group === tab;
  };

  const filtered = rows
    .filter(filter)
    .sort(
      (a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  const afterAdd = async () => {
    await refresh();
    await loadObligations();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-ink-300">
            {t.obligations.title}
          </h2>
          <p className="text-sm text-ink-50">{t.obligations.sub}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddObligationDialog onSuccess={afterAdd}>
            <Button size="sm">
              <Plus className="size-4" />
              {t.obligations.addObligation}
            </Button>
          </AddObligationDialog>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info(t.obligations.erpComingSoon)}
          >
            <Download className="size-4" />
            {t.obligations.pullFromErp}
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="all">{t.obligations.tabs.all}</TabsTrigger>
          <TabsTrigger value="suppliers">
            {t.obligations.tabs.suppliers}
          </TabsTrigger>
          <TabsTrigger value="utilities">
            {t.obligations.tabs.utilities}
          </TabsTrigger>
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
              {!listReady ? (
                <p className="py-10 text-center text-sm text-ink-50">
                  {t.common.loading}
                </p>
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-50">
                  {t.obligations.empty}
                </p>
              ) : (
                <ul className="divide-y divide-snow-200">
                  {filtered.map((o) => (
                    <ObligationRow
                      key={o.id}
                      obligation={o}
                      markedPaid={paidIds.has(o.id)}
                      paying={payingId === o.id}
                      onMarkPaid={handleMarkPaid}
                      onPayFromBank={handlePayFromBank}
                    />
                  ))}
                </ul>
              )}
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
  paying,
  onMarkPaid,
  onPayFromBank,
}: {
  obligation: Obligation;
  markedPaid: boolean;
  paying: boolean;
  onMarkPaid: (id: string) => void;
  onPayFromBank: (id: string) => void;
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
  const dateLabel = obligation.dueDate
    ? format(parseISO(obligation.dueDate), "MMM d")
    : "—";

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-3 px-5 py-4 transition-colors",
        isPaid ? "bg-[#F0FDF4]/60 opacity-75" : "hover:bg-snow-100",
      )}
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
      >
        {obligation.dueDate ? (
          <>
            <span className="text-[10px] uppercase">
              {format(parseISO(obligation.dueDate), "MMM")}
            </span>
            <span className="text-base font-bold leading-none">
              {format(parseISO(obligation.dueDate), "d")}
            </span>
          </>
        ) : (
          <span className="text-xs">—</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold truncate",
            isPaid ? "text-ink-50 line-through" : "text-ink-300",
          )}
        >
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
          variant={
            isPaid
              ? "success"
              : obligation.status === "overdue"
                ? "danger"
                : "secondary"
          }
        >
          {isPaid
            ? t.obligations.status.paid
            : t.obligations.status[obligation.status]}
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
        <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <Button
            size="sm"
            className="inline-flex min-w-[7.5rem] items-center justify-center gap-2"
            disabled={paying}
            onClick={() => onPayFromBank(obligation.id)}
          >
            {paying ? (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            ) : null}
            {paying ? t.common.loading : t.obligations.payFromBank}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={paying}
            onClick={() => onMarkPaid(obligation.id)}
          >
            {t.common.markPaid}
          </Button>
        </div>
      )}
    </li>
  );
}
