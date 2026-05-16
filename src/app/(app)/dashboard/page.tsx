"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { DashboardHero } from "@/components/app/DashboardHero";
import { MetricCard } from "@/components/app/MetricCard";
import { SmartBucketsGrid } from "@/components/app/SmartBucketsGrid";
import { UpcomingPayments } from "@/components/app/UpcomingPayments";
import { CashFlowChart } from "@/components/app/CashFlowChart";
import { AIInsightCards } from "@/components/app/AIInsightCards";
import { DisciplineScoreCard } from "@/components/app/DisciplineScoreCard";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatShortCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { metrics } = useAppData();
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <DashboardHero />

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricCard
          title={t.dashboard.kpis.revenue}
          value={formatShortCurrency(metrics.monthlyRevenue)}
          change={18}
          changeLabel={t.dashboard.kpis.revenueChange}
          icon={TrendingUp}
          tone="success"
        />
        <MetricCard
          title={t.dashboard.kpis.expenses}
          value={formatShortCurrency(metrics.monthlyExpenses)}
          change={5}
          changeLabel={t.dashboard.kpis.expensesChange}
          icon={TrendingDown}
          tone="warning"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SmartBucketsGrid />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <UpcomingPayments />
          <CashFlowChart />
        </div>
      </section>

      <AIInsightCards />

      <section className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <DisciplineScoreCard />
      </section>
    </div>
  );
}
