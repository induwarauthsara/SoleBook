"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn, formatShortCurrency } from "@/lib/utils";
import type { Transaction } from "@/types/app";

const categoryVariant: Record<string, "success" | "warning" | "info" | "secondary" | "default"> = {
  Sales: "success",
  Inventory: "warning",
  Salary: "info",
  Utilities: "secondary",
  Transport: "secondary",
  "Owner Salary": "default",
};

interface RecentTransactionsProps {
  limit?: number;
  href?: string;
}

export function RecentTransactions({
  limit = 6,
  href = "/history",
}: RecentTransactionsProps) {
  const { transactions } = useAppData();
  const { t } = useLocale();
  const items = transactions.slice(0, limit);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-peach-700">
            Ledger feed
          </p>
          <CardTitle className="mt-1.5">Recent transactions</CardTitle>
        </div>
        {href && (
          <Link
            href={href}
            className="text-xs font-semibold text-peach-700 hover:text-peach-600"
          >
            {t.common.viewAll}
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-snow-200">
          {items.map((txn) => (
            <TxnRow key={txn.id} txn={txn} />
          ))}
        </ul>
        {href && (
          <Link
            href={href}
            className="flex items-center justify-between border-t border-snow-300 px-5 py-3 text-sm font-medium text-peach-700 hover:bg-peach-50 transition-colors"
          >
            <span>{t.common.viewAll}</span>
            <ChevronRight className="size-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function TxnRow({ txn }: { txn: Transaction }) {
  const TxnIcon =
    txn.type === "income"
      ? ArrowDownLeft
      : txn.type === "expense"
        ? ArrowUpRight
        : ArrowLeftRight;
  return (
    <li className="flex items-center gap-4 px-5 py-3 hover:bg-snow-100 transition-colors">
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-xl shrink-0",
          txn.type === "income"
            ? "bg-[#ECFDF5] text-[#15803D]"
            : txn.type === "expense"
              ? "bg-[#FEF2F2] text-[#B91C1C]"
              : "bg-peach-50 text-peach-700",
        )}
      >
        <TxnIcon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-300 truncate">
          {txn.description}
        </p>
        <p className="text-xs text-ink-50">
          {format(parseISO(txn.date), "MMM d, yyyy")}
        </p>
      </div>
      <Badge
        variant={categoryVariant[txn.category] ?? "secondary"}
        className="hidden sm:inline-flex shrink-0"
      >
        {txn.category}
      </Badge>
      <p
        className={cn(
          "text-sm font-bold shrink-0",
          txn.type === "income" ? "text-[#15803D]" : "text-ink-300",
        )}
      >
        {txn.type === "income" ? "+" : txn.type === "expense" ? "-" : ""}
        {formatShortCurrency(txn.amount)}
      </p>
    </li>
  );
}
