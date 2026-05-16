"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight, ArrowLeftRight } from "lucide-react";
import { DashboardHero } from "@/components/app/DashboardHero";
import { MetricCard } from "@/components/app/MetricCard";
import { SmartBucketsGrid } from "@/components/app/SmartBucketsGrid";
import { UpcomingPayments } from "@/components/app/UpcomingPayments";
import { CashFlowChart } from "@/components/app/CashFlowChart";
import { AIInsightCards } from "@/components/app/AIInsightCards";
import { DisciplineScoreCard } from "@/components/app/DisciplineScoreCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatShortCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { metrics } = useAppData();
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <DashboardHero />

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <DisciplineScoreCard />
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full relative overflow-hidden border-peach-200 bg-gradient-to-br from-peach-50 via-white to-white p-6">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-peach-500/10 blur-2xl" aria-hidden />
            <div className="relative flex flex-col gap-4 h-full">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-peach-500 text-white">
                <ArrowLeftRight className="size-5" />
              </span>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-ink-300">
                  {t.allocation.title}
                </h3>
                <p className="mt-1 text-xs text-ink-100 leading-relaxed">
                  {t.allocation.sub}
                </p>
              </div>
              <Link href="/allocation">
                <Button className="w-full sm:w-auto">
                  {t.allocation.title}
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

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
    </div>
  );
}
