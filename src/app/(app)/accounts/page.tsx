"use client";

import { Plus, Landmark, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatShortCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function AccountsPage() {
  const { accounts, transactions } = useAppData();
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-300">
            {t.accounts.title}
          </h2>
          <p className="text-sm text-ink-50">{t.accounts.sub}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => toast.info("Bank linking — coming soon")}
        >
          <Plus className="size-4" />
          {t.accounts.addAccount}
        </Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((account, idx) => (
          <article
            key={account.id}
            className="relative overflow-hidden rounded-3xl border border-snow-300 bg-white p-6 shadow-[0_30px_50px_-30px_rgba(15,23,42,0.18)]"
            style={{
              background:
                idx === 0
                  ? "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #312E81 100%)"
                  : "linear-gradient(135deg, #F27344 0%, #D45F33 70%, #823516 100%)",
              color: "#FFFFFF",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">
                  {account.bank}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {account.alias}
                </p>
              </div>
              <Landmark className="size-7 text-white/85" />
            </div>

            <div className="mt-10 flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/70">
                  {t.accounts.balance}
                </p>
                <p className="text-3xl font-bold font-heading text-white">
                  {formatShortCurrency(account.balance)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-white/70">
                  {account.type === "current"
                    ? t.accounts.current
                    : t.accounts.savings}
                </p>
                <p className="text-sm font-semibold text-white">
                  •••• {account.last4}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-snow-200">
            {transactions.slice(0, 6).map((tx) => (
              <li
                key={tx.id}
                className="flex items-center gap-4 px-5 py-3"
              >
                <span
                  className={`size-9 grid place-items-center rounded-xl ${
                    tx.type === "income"
                      ? "bg-[#ECFDF5] text-[#15803D]"
                      : "bg-[#FEF2F2] text-[#B91C1C]"
                  }`}
                >
                  {tx.type === "income" ? (
                    <ArrowDownLeft className="size-4" />
                  ) : (
                    <ArrowUpRight className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-300 truncate">
                    {tx.description}
                  </p>
                  <p className="text-xs text-ink-50">
                    {format(parseISO(tx.date), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge variant="secondary">{tx.category}</Badge>
                <p className="text-sm font-bold text-ink-300">
                  {tx.type === "income" ? "+" : "-"}
                  {formatShortCurrency(tx.amount)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
