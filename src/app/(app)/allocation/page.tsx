"use client";

import { useMemo, useState } from "react";
import { Sparkles, RotateCcw, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatShortCurrency } from "@/lib/utils";
import { toast } from "sonner";

const DEFAULT_SPLIT = {
  operations: 50,
  obligations: 28,
  reserve: 12,
  owner_salary: 8,
  growth: 2,
};

type SplitKey = keyof typeof DEFAULT_SPLIT;

export default function AllocationPage() {
  const { t } = useLocale();
  const { buckets } = useAppData();
  const [incoming, setIncoming] = useState("185000");
  const [split, setSplit] = useState({ ...DEFAULT_SPLIT });

  const amount = Number(incoming) || 0;

  const rows = useMemo(() => {
    return (Object.keys(split) as SplitKey[]).map((key) => {
      const bucket = buckets.find((b) => b.name === key);
      return {
        key,
        pct: split[key],
        amount: Math.round((amount * split[key]) / 100),
        color: bucket?.color ?? "#F27344",
        label: bucket?.label ?? key,
      };
    });
  }, [split, amount, buckets]);

  const total = rows.reduce((s, r) => s + r.pct, 0);

  const updateSplit = (key: SplitKey, raw: number) => {
    const next = Math.max(0, Math.min(100, raw));
    setSplit((prev) => ({ ...prev, [key]: next }));
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-ink-300">{t.allocation.title}</h2>
        <p className="text-sm text-ink-50">{t.allocation.sub}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t.allocation.incoming}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <label className="md:col-span-2 block">
              <span className="text-xs font-medium text-ink-100">
                {t.allocation.incoming}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                value={incoming}
                onChange={(e) => setIncoming(e.target.value)}
                className="mt-1"
              />
            </label>
            <div className="flex items-center gap-2 md:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSplit({ ...DEFAULT_SPLIT })}
              >
                <RotateCcw className="size-4" />
                {t.allocation.reset}
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  toast.success(
                    `Allocated ${formatShortCurrency(amount)} across 5 buckets`,
                  )
                }
              >
                <Check className="size-4" />
                {t.allocation.apply}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-snow-300 bg-snow-100 p-3">
            <div className="flex items-center justify-between text-xs text-ink-100">
              <span className="inline-flex items-center gap-1.5 text-peach-700 font-semibold">
                <Sparkles className="size-3.5" />
                AI recommended split
              </span>
              <span className={total === 100 ? "text-[#15803D]" : "text-[#B91C1C]"}>
                Total: {total}%
              </span>
            </div>
            <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full">
              {rows.map((row) => (
                <div
                  key={row.key}
                  style={{ width: `${row.pct}%`, background: row.color }}
                  title={`${row.label} · ${row.pct}%`}
                />
              ))}
            </div>
          </div>

          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex items-center gap-3 sm:gap-4"
              >
                <span
                  className="size-8 shrink-0 rounded-xl"
                  style={{ background: `${row.color}1A` }}
                >
                  <span
                    className="block size-full rounded-xl border border-white"
                    style={{ background: row.color, opacity: 0.85 }}
                  />
                </span>
                <span className="w-32 sm:w-40 text-sm font-medium text-ink-300 shrink-0">
                  {row.label}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={row.pct}
                  onChange={(e) =>
                    updateSplit(row.key, Number(e.target.value))
                  }
                  className="flex-1 accent-peach-500"
                />
                <span className="w-12 text-right text-sm font-semibold text-ink-300">
                  {row.pct}%
                </span>
                <span className="hidden sm:inline-flex w-24 text-right text-xs text-ink-50">
                  {formatShortCurrency(row.amount)}
                </span>
              </li>
            ))}
          </ul>

          <p className="rounded-2xl border-l-2 border-peach-500 bg-peach-50 px-4 py-2.5 text-xs text-ink-100">
            “Obligations are tight this week. Increasing their share temporarily
            protects rent and salaries before growth spending.” —{" "}
            <span className="font-semibold text-peach-700">SoleBook AI</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current bucket health</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {buckets.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-snow-300 p-3"
            >
              <span
                className="inline-block size-7 rounded-lg mb-2"
                style={{ background: `${b.color}1A` }}
              >
                <span
                  className="block size-full rounded-lg border border-white"
                  style={{ background: b.color, opacity: 0.85 }}
                />
              </span>
              <p className="text-xs text-ink-50">{b.label}</p>
              <p className="text-base font-bold text-ink-300">
                {formatShortCurrency(b.balance)}
              </p>
              <Badge variant="secondary" className="mt-2">
                Target {b.targetPct}%
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
