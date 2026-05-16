"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { isThisMonth, isThisWeek, isToday, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs";
import { TxnRow } from "@/components/app/RecentTransactions";
import { AddExpenseDialog } from "@/components/app/AddExpenseDialog";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatShortCurrency } from "@/lib/utils";
import { toast } from "sonner";

type TypeFilter = "all" | "income" | "expense" | "transfer";

export default function HistoryPage() {
  const { transactions } = useAppData();
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const summaries = useMemo(() => {
    const today = transactions
      .filter((tx) => tx.type === "expense" && isToday(parseISO(tx.date)))
      .reduce((s, tx) => s + tx.amount, 0);
    const week = transactions
      .filter(
        (tx) =>
          tx.type === "expense" &&
          isThisWeek(parseISO(tx.date), { weekStartsOn: 1 }),
      )
      .reduce((s, tx) => s + tx.amount, 0);
    const month = transactions
      .filter((tx) => tx.type === "expense" && isThisMonth(parseISO(tx.date)))
      .reduce((s, tx) => s + tx.amount, 0);
    return { today, week, month };
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (
        query &&
        !`${tx.description} ${tx.category}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        return false;
      const date = parseISO(tx.date).getTime();
      if (from && date < parseISO(from).getTime()) return false;
      if (to && date > parseISO(to).getTime() + 86_400_000) return false;
      return true;
    });
  }, [transactions, typeFilter, query, from, to]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-ink-300">{t.history.title}</h2>
        <p className="text-sm text-ink-50">{t.history.sub}</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label={t.history.todayCard} value={summaries.today} />
        <SummaryCard label={t.history.weekCard} value={summaries.week} />
        <SummaryCard label={t.history.monthCard} value={summaries.month} />
      </section>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Transactions</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <AddExpenseDialog>
                <Button size="sm">
                  <Plus className="size-4" />
                  {t.history.addExpense}
                </Button>
              </AddExpenseDialog>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info("ERP import — coming soon")}
              >
                <Download className="size-4" />
                {t.history.fromErp}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-50" />
              <Input
                placeholder={t.history.searchPlaceholder}
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-100">
              <span>{t.history.dateRange}:</span>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 w-auto"
              />
              <span className="text-ink-50">–</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 w-auto"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="px-5 pb-3">
            <Tabs
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              <TabsList>
                <TabsTrigger value="all">{t.history.filterAll}</TabsTrigger>
                <TabsTrigger value="income">{t.history.filterIncome}</TabsTrigger>
                <TabsTrigger value="expense">{t.history.filterExpense}</TabsTrigger>
                <TabsTrigger value="transfer">{t.history.filterTransfer}</TabsTrigger>
              </TabsList>
              <TabsContent value={typeFilter} className="mt-4">
                {filtered.length === 0 ? (
                  <p className="py-10 text-center text-sm text-ink-50">
                    {t.history.empty}
                  </p>
                ) : (
                  <ul className="divide-y divide-snow-200 -mx-5">
                    {filtered.map((txn) => (
                      <li
                        key={txn.id}
                        className="flex items-center gap-3 px-5"
                      >
                        <TxnRow txn={txn} />
                        {txn.source && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 hidden md:inline-flex mr-3"
                          >
                            {txn.source === "erp"
                              ? t.history.erp
                              : txn.source === "bank"
                                ? t.history.bank
                                : t.history.manual}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card padded>
      <p className="text-[11px] uppercase tracking-wider text-ink-50">{label}</p>
      <p className="mt-2 text-2xl font-bold font-heading text-ink-300">
        {formatShortCurrency(value)}
      </p>
    </Card>
  );
}
