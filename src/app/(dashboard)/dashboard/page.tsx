"use client";

import React from "react";
import {
  Wallet,
  TrendingUp,
  Shield,
  Star,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SmartBuckets } from "@/components/dashboard/smart-buckets";
import { AIRecommendation } from "@/components/dashboard/ai-recommendation";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ObligationsTimeline } from "@/components/dashboard/obligations-timeline";
import { mockMetrics } from "@/lib/mock-data";
import { formatShortCurrency, formatPercent } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Page header */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#080D1A]/90 p-6 lg:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
        <div className="absolute inset-x-8 top-0 h-px peach-rule" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-burnt-peach/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-burnt-peach">
              Financial Discipline Control Room
            </p>
            <h1 className="mt-3 text-3xl lg:text-4xl font-bold font-heading text-bright-snow">
              Nimal&apos;s cash is under control.
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              AI has reserved urgent obligations, protected owner salary, and flagged where cash timing needs attention.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Risk</p>
              <p className="mt-1 font-heading text-lg font-bold text-warning">Caution</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Runway</p>
              <p className="mt-1 font-heading text-lg font-bold text-bright-snow">{mockMetrics.cashRunway}d</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-burnt-peach/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Score</p>
              <p className="mt-1 font-heading text-lg font-bold text-burnt-peach">{mockMetrics.disciplineScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Current Balance"
          value={formatShortCurrency(mockMetrics.currentBalance)}
          rawValue={mockMetrics.currentBalance}
          icon={Wallet}
          iconColor="text-burnt-peach"
          iconBg="bg-burnt-peach/15"
          change={8}
          changeLabel="vs last month"
          trend="up"
          index={0}
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatShortCurrency(mockMetrics.monthlyRevenue)}
          rawValue={mockMetrics.monthlyRevenue}
          icon={TrendingUp}
          iconColor="text-success"
          iconBg="bg-success/15"
          change={18}
          changeLabel="vs April"
          trend="up"
          index={1}
        />
        <MetricCard
          title="Monthly Expenses"
          value={formatShortCurrency(mockMetrics.monthlyExpenses)}
          rawValue={mockMetrics.monthlyExpenses}
          icon={AlertTriangle}
          iconColor="text-warning"
          iconBg="bg-warning/15"
          change={5}
          changeLabel="vs last month"
          trend="up"
          index={2}
        />
        <MetricCard
          title="Reserve Health"
          value={formatPercent(mockMetrics.reserveHealth, 0)}
          rawValue={mockMetrics.reserveHealth}
          icon={Shield}
          iconColor="text-info"
          iconBg="bg-info/15"
          change={-3}
          changeLabel="down from 65%"
          trend="down"
          index={3}
        />
        <MetricCard
          title="Discipline Score"
          value={`${mockMetrics.disciplineScore}/100`}
          rawValue={mockMetrics.disciplineScore}
          icon={Star}
          iconColor="text-burnt-peach"
          iconBg="bg-burnt-peach/15"
          change={4}
          changeLabel="improved this month"
          trend="up"
          index={4}
        />
        <MetricCard
          title="Cash Runway"
          value={`${mockMetrics.cashRunway} days`}
          rawValue={mockMetrics.cashRunway}
          icon={Clock}
          iconColor="text-warning"
          iconBg="bg-warning/15"
          changeLabel="at current burn rate"
          index={5}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left col — buckets + recommendation */}
        <div className="xl:col-span-1 space-y-5">
          <SmartBuckets />
          <AIRecommendation />
        </div>

        {/* Right col — chart + obligations */}
        <div className="xl:col-span-2 space-y-5">
          <CashFlowChart />
          <ObligationsTimeline />
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
}
