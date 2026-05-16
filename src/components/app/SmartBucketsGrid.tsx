"use client";

import { Briefcase, AlertCircle, Shield, User, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn, formatShortCurrency, formatPercent } from "@/lib/utils";
import type { Bucket } from "@/types/app";

const iconMap: Record<string, typeof Briefcase> = {
  Briefcase,
  AlertCircle,
  Shield,
  User,
  TrendingUp,
};

/**
 * Renders the four primary buckets in a 2x2 grid:
 * Operations · Obligations · Profit Reserve · Owner Salary.
 * Growth, when present, surfaces as a slim footer row below the grid.
 */
export function SmartBucketsGrid() {
  const { buckets } = useAppData();
  const { t } = useLocale();

  const primaryNames = ["operations", "obligations", "reserve", "owner_salary"];
  const primary = primaryNames
    .map((name) => buckets.find((b) => b.name === name))
    .filter((b): b is Bucket => Boolean(b));
  const growth = buckets.find((b) => b.name === "growth");
  const total = buckets.reduce((s, b) => s + b.balance, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-peach-700">
            {t.dashboard.smartBuckets.eyebrow}
          </p>
          <CardTitle className="mt-1.5">
            {t.dashboard.smartBuckets.title}
          </CardTitle>
          <p className="mt-1 text-xs text-ink-50">
            {t.dashboard.smartBuckets.sub}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {t.dashboard.smartBuckets.total}: {formatShortCurrency(total)}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {primary.map((bucket) => (
            <BucketTile key={bucket.id} bucket={bucket} total={total} />
          ))}
        </div>
        {growth && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-snow-300 bg-snow-100 px-4 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-ink-200">
              <span
                className="inline-flex size-7 items-center justify-center rounded-lg"
                style={{ background: `${growth.color}1A` }}
              >
                <TrendingUp className="size-3.5" style={{ color: growth.color }} />
              </span>
              <span className="font-medium">{growth.label}</span>
            </span>
            <span className="font-semibold text-ink-300">
              {formatShortCurrency(growth.balance)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BucketTile({ bucket, total }: { bucket: Bucket; total: number }) {
  const Icon = iconMap[bucket.icon] ?? Briefcase;
  const actualPct = total > 0 ? (bucket.balance / total) * 100 : 0;
  const onTrack = actualPct >= bucket.targetPct * 0.8;

  return (
    <div className="rounded-2xl border border-snow-300 bg-white p-4 hover:border-snow-400 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <span
          className="inline-flex size-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: `${bucket.color}1A` }}
        >
          <Icon className="size-5" style={{ color: bucket.color }} />
        </span>
        <span
          className={cn(
            "inline-flex size-2 rounded-full mt-1",
            onTrack ? "bg-[#22C55E]" : "bg-[#F59E0B]",
          )}
          aria-label={onTrack ? "On track" : "Below target"}
        />
      </div>

      <div className="mt-3">
        <p className="text-xs text-ink-50">{bucket.label}</p>
        <p className="mt-0.5 text-xl font-bold font-heading text-ink-300">
          {formatShortCurrency(bucket.balance)}
        </p>
      </div>

      <div className="mt-3 relative h-1.5 w-full overflow-hidden rounded-full bg-snow-200">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(actualPct, 100)}%`,
            background: bucket.color,
          }}
        />
        <span
          className="absolute top-0 h-full w-px bg-ink-100/40"
          style={{ left: `${bucket.targetPct}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-ink-50">
        <span>{formatPercent(actualPct, 0)} actual</span>
        <span>{formatPercent(bucket.targetPct, 0)} target</span>
      </div>
    </div>
  );
}
