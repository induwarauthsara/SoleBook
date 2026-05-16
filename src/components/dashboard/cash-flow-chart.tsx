"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { generateForecast } from "@/lib/mock-data";
import { formatShortCurrency } from "@/lib/utils";

const forecast = generateForecast();

const PERIODS = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs border border-border">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="text-bright-snow font-semibold">
          {formatShortCurrency(payload[0].value)}
        </p>
        {payload[1]?.value > 0 && (
          <p className="text-warning">Obligations: {formatShortCurrency(payload[1].value)}</p>
        )}
      </div>
    );
  }
  return null;
};

export function CashFlowChart() {
  const [period, setPeriod] = useState(14);

  const data = forecast.slice(0, period).map((p) => ({
    date: format(parseISO(p.date), "MMM d"),
    balance: Math.round(p.projected_balance / 1000),
    obligations: Math.round(p.obligations / 1000),
    risk: p.risk_level,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-burnt-peach">
              Forward View
            </p>
            <CardTitle className="mt-1">Cash Flow Forecast</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Projected balance (Rs. 000s)
            </p>
          </div>
          <div className="flex gap-1 bg-white/[0.04] rounded-full p-1 border border-white/[0.08]">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  period === p.days
                    ? "bg-burnt-peach text-white"
                    : "text-muted-foreground hover:text-bright-snow"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          key={period}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-52"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F27344" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F27344" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="obligGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(248,250,252,0.08)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748B" }}
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
                fill="url(#obligGrad)"
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#F27344"
                strokeWidth={2}
                fill="url(#balanceGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#F27344", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-burnt-peach rounded-full" />
            <span className="text-[10px] text-muted-foreground">Projected Balance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-warning rounded-full opacity-70" style={{ borderStyle: "dashed" }} />
            <span className="text-[10px] text-muted-foreground">Obligations</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
