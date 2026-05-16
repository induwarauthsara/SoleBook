"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Wallet, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatShortCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function OwnerWithdrawalPage() {
  const { t } = useLocale();
  const { business, withdrawals, addWithdrawal } = useAppData();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const taken = useMemo(
    () => withdrawals.reduce((s, w) => s + w.amount, 0),
    [withdrawals],
  );
  const remaining = Math.max(0, business.salaryGoal - taken);
  const progress = Math.min(100, (taken / business.salaryGoal) * 100);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    addWithdrawal({
      id: `ow-${Date.now()}`,
      businessId: business.id,
      amount: value,
      date: new Date().toISOString(),
      note: note || undefined,
    });
    toast.success(`Withdrew ${formatShortCurrency(value)}`);
    setAmount("");
    setNote("");
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-ink-300">{t.owner.title}</h2>
        <p className="text-sm text-ink-50">{t.owner.sub}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t.owner.withdraw}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleWithdraw}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="flex-1 block">
              <span className="text-xs font-medium text-ink-100">
                {t.history.addModal.amount}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="mt-1"
                required
              />
            </label>
            <label className="flex-1 block">
              <span className="text-xs font-medium text-ink-100">Note</span>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. May salary"
                className="mt-1"
              />
            </label>
            <Button type="submit" className="shrink-0">
              <Wallet className="size-4" />
              {t.owner.withdraw}
            </Button>
          </form>
          {taken > business.salaryGoal && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#FEF2F2] px-3 py-2 text-xs text-[#B91C1C]">
              <AlertTriangle className="size-4 shrink-0" />
              You’ve exceeded the planned monthly salary by{" "}
              {formatShortCurrency(taken - business.salaryGoal)} — this can
              squeeze upcoming payroll.
            </p>
          )}
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card padded>
          <p className="text-[11px] uppercase tracking-wider text-ink-50">
            {t.owner.planned}
          </p>
          <p className="mt-2 text-2xl font-bold text-ink-300">
            {formatShortCurrency(business.salaryGoal)}
          </p>
        </Card>
        <Card padded>
          <p className="text-[11px] uppercase tracking-wider text-ink-50">
            {t.owner.taken}
          </p>
          <p className="mt-2 text-2xl font-bold text-ink-300">
            {formatShortCurrency(taken)}
          </p>
          <Progress value={progress} className="mt-2" />
        </Card>
        <Card padded>
          <p className="text-[11px] uppercase tracking-wider text-ink-50">
            {t.owner.remaining}
          </p>
          <p className="mt-2 text-2xl font-bold text-ink-300">
            {formatShortCurrency(remaining)}
          </p>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t.owner.history}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-snow-200">
            {withdrawals.map((w) => (
              <li
                key={w.id}
                className="flex items-center gap-4 px-5 py-3"
              >
                <span className="size-9 rounded-xl bg-peach-50 text-peach-700 grid place-items-center">
                  <Wallet className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-300 truncate">
                    {w.note ?? "Owner withdrawal"}
                  </p>
                  <p className="text-xs text-ink-50">
                    {format(parseISO(w.date), "MMM d, yyyy")}
                  </p>
                </div>
                <p className="text-sm font-bold text-ink-300">
                  {formatShortCurrency(w.amount)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
