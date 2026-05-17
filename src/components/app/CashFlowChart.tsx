"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAppData } from "@/components/providers/AppDataProvider";
import { formatShortCurrency } from "@/lib/utils";
import { useLocale } from "@/components/providers/LocaleProvider";

function finiteNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

const PERIODS = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
];

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const balance = payload[0]?.value ?? 0;
  const obligations = payload[1]?.value ?? 0;
  return (
    <div className="rounded-lg border border-snow-300 bg-white px-3 py-2 text-xs shadow-md">
      <p className="text-ink-50">{label}</p>
      <p className="font-semibold text-ink-300">
        {formatShortCurrency(balance * 1000)}
      </p>
      {obligations > 0 && (
        <p className="text-[#B45309]">
          Obligations: {formatShortCurrency(obligations * 1000)}
        </p>
      )}
    </div>
  );
}

export function CashFlowChart() {
  const { t } = useLocale();
  const [period, setPeriod] = useState(14);
  const { cashFlowForecast } = useAppData();
  const data = useMemo(() => {
    return cashFlowForecast.slice(0, period).map((p) => {
      let label = p.date;
      try {
        label = format(parseISO(p.date), "MMM d");
      } catch {
        /* invalid date from API */
      }
      return {
        date: label,
        balance: Math.round(finiteNum(p.projectedBalance) / 1000),
        obligations: 0,
      };
    });
  }, [cashFlowForecast, period]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-peach-700">
            {t.dashboard.forecast.eyebrow}
          </p>
          <CardTitle className="mt-1.5">{t.dashboard.forecast.title}</CardTitle>
          <p className="mt-1 text-xs text-ink-50">{t.dashboard.forecast.sub}</p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-snow-300 bg-snow-100 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setPeriod(p.days)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                period === p.days
                  ? "bg-peach-500 text-white shadow-sm"
                  : "text-ink-100 hover:text-ink-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="cf-balance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F27344" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#F27344" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cf-oblig" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(15,23,42,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="obligations"
                stroke="#F59E0B"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="url(#cf-oblig)"
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#F27344"
                strokeWidth={2.5}
                fill="url(#cf-balance)"
                dot={false}
                activeDot={{ r: 4, fill: "#F27344", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full bg-peach-500" />
            <span className="text-[11px] text-ink-50">
              {t.dashboard.forecast.legendBalance}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-full border border-dashed border-[#F59E0B] bg-[#F59E0B]/30"
              style={{ borderStyle: "dashed" }}
            />
            <span className="text-[11px] text-ink-50">
              {t.dashboard.forecast.legendObligations}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
