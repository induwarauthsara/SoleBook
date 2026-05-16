"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import {
  Sparkles,
  AlertTriangle,
  Info,
  TrendingUp,
  Shield,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockInsights, mockScore, generateForecast } from "@/lib/mock-data";
import { cn, formatShortCurrency, getScoreColor, getScoreLabel } from "@/lib/utils";
import type { AIInsight } from "@/types";

const forecast = generateForecast();

const severityConfig = {
  critical: { color: "text-danger", bg: "bg-danger/10 border-danger/25", icon: AlertTriangle, dot: "bg-danger" },
  warning: { color: "text-warning", bg: "bg-warning/10 border-warning/25", icon: AlertTriangle, dot: "bg-warning" },
  info: { color: "text-info", bg: "bg-info/10 border-info/25", icon: Info, dot: "bg-info" },
  positive: { color: "text-success", bg: "bg-success/10 border-success/25", icon: TrendingUp, dot: "bg-success" },
};

function InsightCard({ insight, index }: { insight: AIInsight; index: number }) {
  const config = severityConfig[insight.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={cn(
        "rounded-xl border p-4 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-card-hover cursor-pointer",
        config.bg
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", `${config.bg}`)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-bright-snow leading-tight">
              {insight.message}
            </p>
            <Badge
              variant={
                insight.severity === "critical"
                  ? "destructive"
                  : insight.severity === "warning"
                  ? "warning"
                  : insight.severity === "positive"
                  ? "success"
                  : "info"
              }
              className="shrink-0 text-[10px]"
            >
              {insight.severity}
            </Badge>
          </div>
          {insight.detail && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {insight.detail}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground bg-surface border border-border px-2 py-0.5 rounded-full">
              {insight.category}
            </span>
            {insight.action && (
              <button className={cn("text-xs font-medium flex items-center gap-0.5 hover:gap-1.5 transition-all", config.color)}>
                {insight.action} <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const ringRef = useRef<SVGCircleElement>(null);
  const r = size * 0.4;
  const circumference = 2 * Math.PI * r;
  const color = getScoreColor(score);

  useEffect(() => {
    if (ringRef.current) {
      const dashOffset = circumference - (score / 100) * circumference;
      gsap.fromTo(
        ringRef.current,
        { strokeDashoffset: circumference },
        { strokeDashoffset: dashOffset, duration: 1.2, ease: "power2.out" }
      );
    }
  }, [score, circumference]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2A3F5F" strokeWidth="6" />
          <circle
            ref={ringRef}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-center leading-tight max-w-16">{label}</p>
    </div>
  );
}

const radarData = [
  { subject: "Payments", score: mockScore.payment_timeliness },
  { subject: "Reserve", score: mockScore.reserve_consistency },
  { subject: "Salary", score: mockScore.salary_stability },
  { subject: "Leakage", score: mockScore.personal_leakage },
  { subject: "Loans", score: mockScore.loan_readiness },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs border border-border">
        <p className="text-muted-foreground mb-0.5">{label}</p>
        <p className="text-bright-snow font-bold">{formatShortCurrency(payload[0]?.value * 1000 || 0)}</p>
      </div>
    );
  }
  return null;
};

export default function InsightsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(14);
  const forecastData = forecast.slice(0, selectedPeriod).map((p) => ({
    date: format(parseISO(p.date), "MMM d"),
    balance: Math.round(p.projected_balance / 1000),
    obligations: Math.round(p.obligations / 1000),
    income: Math.round(p.income_expected / 1000),
    risk: p.risk_level,
  }));

  const criticalCount = mockInsights.filter((i) => i.severity === "critical").length;
  const warningCount = mockInsights.filter((i) => i.severity === "warning").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-bright-snow">AI Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Intelligent analysis of your business financial behavior.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Insights feed */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-4 h-4 text-burnt-peach" />
            <span className="text-sm font-semibold text-bright-snow">
              {mockInsights.length} active insights
            </span>
            {criticalCount > 0 && (
              <span className="text-xs bg-danger/15 text-danger border border-danger/25 px-2 py-0.5 rounded-full">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-xs bg-warning/15 text-warning border border-warning/25 px-2 py-0.5 rounded-full">
                {warningCount} warnings
              </span>
            )}
          </div>

          {mockInsights.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight} index={i} />
          ))}
        </div>

        {/* Right: Score + loan readiness */}
        <div className="space-y-5">
          {/* Overall score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Financial Discipline Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-5">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="46" fill="none" stroke="#2A3F5F" strokeWidth="8" />
                    <ScoreArc score={mockScore.overall} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="text-3xl font-bold font-heading"
                      style={{ color: getScoreColor(mockScore.overall) }}
                    >
                      {mockScore.overall}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getScoreLabel(mockScore.overall)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Payments", score: mockScore.payment_timeliness },
                  { label: "Reserve", score: mockScore.reserve_consistency },
                  { label: "Salary", score: mockScore.salary_stability },
                  { label: "Leakage", score: mockScore.personal_leakage },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-bold" style={{ color: getScoreColor(item.score) }}>
                        {item.score}
                      </span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: getScoreColor(item.score) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Loan readiness */}
          <Card className="border-info/20" style={{ background: "rgba(59,130,246,0.05)" }}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-info/15">
                  <BadgeCheck className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-bright-snow">Loan Readiness</p>
                  <p className="text-xs text-muted-foreground">Based on banking behavior</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl font-bold font-heading text-info">
                  {mockScore.loan_readiness}
                </span>
                <div className="flex-1">
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mockScore.loan_readiness}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-info"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">80+ unlocks preferential rates</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Consistent on-time payments and reserve growth have improved your banking profile. 
                Reach 80 to unlock better loan options.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forecast chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cash Flow Forecast</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Projected balance, income & obligations (Rs. 000s)</p>
            </div>
            <div className="flex gap-1 bg-surface-elevated rounded-lg p-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedPeriod(d)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all duration-200",
                    selectedPeriod === d
                      ? "bg-burnt-peach text-white"
                      : "text-muted-foreground hover:text-bright-snow"
                  )}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F27344" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F27344" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3F5F" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={1.5} fill="url(#incGrad)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="balance" stroke="#F27344" strokeWidth={2} fill="url(#balGrad)" dot={false} activeDot={{ r: 4, fill: "#F27344", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// SVG arc helper drawn inline to avoid extra file
function ScoreArc({ score }: { score: number }) {
  const ringRef = useRef<SVGCircleElement>(null);
  const circumference = 2 * Math.PI * 46;
  const color = getScoreColor(score);

  useEffect(() => {
    if (ringRef.current) {
      const dashOffset = circumference - (score / 100) * circumference;
      gsap.fromTo(
        ringRef.current,
        { strokeDashoffset: circumference },
        { strokeDashoffset: dashOffset, duration: 1.5, ease: "power2.out" }
      );
    }
  }, [score, circumference]);

  return (
    <circle
      ref={ringRef}
      cx="56" cy="56" r="46"
      fill="none"
      stroke={color}
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray={circumference}
      strokeDashoffset={circumference}
    />
  );
}
