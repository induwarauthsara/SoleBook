"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  rawValue: number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: "up" | "down" | "neutral";
  index?: number;
}

export function MetricCard({
  title,
  value,
  rawValue,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "text-burnt-peach",
  iconBg = "bg-burnt-peach/15",
  trend = "neutral",
  index = 0,
}: MetricCardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (valueRef.current) {
      gsap.fromTo(
        valueRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, delay: index * 0.1 + 0.2 }
      );
    }
  }, [index]);

  const trendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
      ? "text-danger"
      : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card
        glow
        className="p-5 hover:translate-y-[-2px] transition-transform duration-300"
      >
        <div className="flex items-start justify-between mb-5">
          <div className={cn("p-2.5 rounded-xl border border-white/[0.06]", iconBg)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-xs font-medium",
                trendColor
              )}
            >
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.22em] mb-2">
            {title}
          </p>
          <span
            ref={valueRef}
            className="text-2xl font-bold font-heading text-bright-snow"
          >
            {value}
          </span>
          {changeLabel && (
            <p className="text-xs text-muted-foreground mt-1">{changeLabel}</p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
