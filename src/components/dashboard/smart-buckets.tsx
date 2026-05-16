"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  AlertCircle,
  Shield,
  User,
  TrendingUp,
} from "lucide-react";
import { cn, formatShortCurrency, formatPercent } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { mockBuckets } from "@/lib/mock-data";
import type { Bucket } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  Briefcase,
  AlertCircle,
  Shield,
  User,
  TrendingUp,
};

function BucketBar({ bucket, index }: { bucket: Bucket; index: number }) {
  const Icon = iconMap[bucket.icon] ?? Briefcase;
  const totalBalance = mockBuckets.reduce((s, b) => s + b.balance, 0);
  const actualPct = totalBalance > 0 ? (bucket.balance / totalBalance) * 100 : 0;
  const isHealthy = actualPct >= bucket.target_pct * 0.8;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
    >
      <div className="flex items-center gap-3 py-3 border-b border-white/[0.06] last:border-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06]"
          style={{ backgroundColor: `${bucket.color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: bucket.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-bright-snow">{bucket.label}</span>
            <span className="text-sm font-bold text-bright-snow">
              {formatShortCurrency(bucket.balance)}
            </span>
          </div>
          <div className="relative h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(actualPct, 100)}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 + 0.3, ease: "easeOut" }}
              className="absolute h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${bucket.color}99, ${bucket.color})`,
              }}
            />
            {/* Target line */}
            <div
              className="absolute top-0 h-full w-0.5 bg-bright-snow/30"
              style={{ left: `${bucket.target_pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">
              {formatPercent(actualPct, 0)} actual
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatPercent(bucket.target_pct, 0)} target
            </span>
          </div>
        </div>

        <div className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          isHealthy ? "bg-success" : "bg-warning"
        )} />
      </div>
    </motion.div>
  );
}

export function SmartBuckets() {
  const totalBalance = mockBuckets.reduce((s, b) => s + b.balance, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-burnt-peach">
              Money Flow
            </p>
            <CardTitle className="mt-1">Smart Buckets</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.08]">
            Total: {formatShortCurrency(totalBalance)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Every rupee is assigned before it leaks.</p>
      </CardHeader>
      <CardContent>
        <div>
          {mockBuckets.map((bucket, index) => (
            <BucketBar key={bucket.id} bucket={bucket} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
