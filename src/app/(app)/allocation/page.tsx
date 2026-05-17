"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, RotateCcw, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatShortCurrency } from "@/lib/utils";
import { readJsonSafe } from "@/lib/api-error";
import { toast } from "sonner";
import type { Bucket } from "@/types/app";

type SplitState = {
  operations: number;
  obligations: number;
  reserve: number;
  owner_salary: number;
  growth: number;
};

const SPLIT_KEYS: (keyof SplitState)[] = [
  "operations",
  "obligations",
  "reserve",
  "owner_salary",
  "growth",
];

/** Matches default buckets created at registration when API data is unavailable. */
const FALLBACK_SPLIT: SplitState = {
  operations: 45,
  obligations: 25,
  reserve: 10,
  owner_salary: 15,
  growth: 5,
};

function splitFromBucketTargets(buckets: Bucket[]): SplitState {
  const get = (type: string) =>
    Math.round(buckets.find((b) => b.name === type)?.targetPct ?? 0);
  return {
    operations: get("operations"),
    obligations: get("obligations"),
    reserve: get("profit_reserve"),
    owner_salary: get("owner_salary"),
    growth: get("growth"),
  };
}

function fixPercentSum(split: SplitState): SplitState {
  const sum = SPLIT_KEYS.reduce((s, k) => s + split[k], 0);
  const diff = 100 - sum;
  return {
    ...split,
    operations: Math.max(0, Math.min(100, split.operations + diff)),
  };
}

function bucketTypeForSplitKey(key: keyof SplitState): string {
  return key === "reserve" ? "profit_reserve" : key;
}

type ComputeLineAmounts = {
  operations: number;
  obligations: number;
  profit_reserve: number;
  owner_salary: number;
  growth: number;
};

function splitPercentsFromEngine(amount: number, data: ComputeLineAmounts): SplitState {
  if (amount <= 0) return { ...FALLBACK_SPLIT };
  const split: SplitState = {
    operations: Math.round((data.operations / amount) * 100),
    obligations: Math.round((data.obligations / amount) * 100),
    reserve: Math.round((data.profit_reserve / amount) * 100),
    owner_salary: Math.round((data.owner_salary / amount) * 100),
    growth: Math.round((data.growth / amount) * 100),
  };
  return fixPercentSum(split);
}

export default function AllocationPage() {
  const { t } = useLocale();
  const { session } = useAuth();
  const { buckets, isLoading: appLoading } = useAppData();
  const bucketsRef = useRef(buckets);
  bucketsRef.current = buckets;

  const [incoming, setIncoming] = useState("185000");
  const [debouncedIncoming, setDebouncedIncoming] = useState("185000");
  const [split, setSplit] = useState<SplitState>({ ...FALLBACK_SPLIT });
  const [explanation, setExplanation] = useState("");
  const [recoLoading, setRecoLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedIncoming(incoming), 400);
    return () => clearTimeout(timer);
  }, [incoming]);

  const loadRecommendation = useCallback(
    async (amountValue: number, opts?: { silent?: boolean }) => {
      const b = bucketsRef.current;
      const applyBucketFallback = () => {
        setSplit(
          fixPercentSum(b.length ? splitFromBucketTargets(b) : { ...FALLBACK_SPLIT }),
        );
        setExplanation("");
      };

      if (!session?.access_token || amountValue <= 0) {
        applyBucketFallback();
        return;
      }

      setRecoLoading(true);
      try {
        const res = await fetch("/api/allocations/compute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ amount: amountValue, persist: false }),
        });
        const data = await readJsonSafe(res);

        if (!res.ok) {
          applyBucketFallback();
          if (!opts?.silent) {
            toast.info(t.allocation.recommendationError);
          }
          return;
        }

        const d = data as Record<string, unknown>;
        const amounts: ComputeLineAmounts = {
          operations: Number(d.operations),
          obligations: Number(d.obligations),
          profit_reserve: Number(d.profit_reserve),
          owner_salary: Number(d.owner_salary),
          growth: Number(d.growth),
        };
        setSplit(splitPercentsFromEngine(amountValue, amounts));
        setExplanation(typeof d.explanation === "string" ? d.explanation : "");
      } finally {
        setRecoLoading(false);
      }
    },
    [session?.access_token, t.allocation.recommendationError],
  );

  useEffect(() => {
    if (appLoading) return;
    const amountValue = Number(debouncedIncoming) || 0;
    void loadRecommendation(amountValue, { silent: true });
  }, [debouncedIncoming, appLoading, loadRecommendation]);

  const amount = Number(incoming) || 0;

  const rows = useMemo(() => {
    return SPLIT_KEYS.map((key) => {
      const bucket = buckets.find((b) => b.name === bucketTypeForSplitKey(key));
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

  const updateSplit = (key: keyof SplitState, raw: number) => {
    const next = Math.max(0, Math.min(100, raw));
    setSplit((prev) => ({ ...prev, [key]: next }));
  };

  const insightText =
    explanation.trim() ||
    "“Obligations are tight this week. Increasing their share temporarily protects rent and salaries before growth spending.”";

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
                disabled={recoLoading || amount <= 0}
                onClick={() => void loadRecommendation(amount)}
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
                {t.allocation.recommendedSplit}
              </span>
              <span className={total === 100 ? "text-[#15803D]" : "text-[#B91C1C]"}>
                {recoLoading ? t.common.loading : `Total: ${total}%`}
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
            {insightText}
            {" — "}
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
