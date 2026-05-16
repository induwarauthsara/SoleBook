"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AIInsightCards } from "@/components/app/AIInsightCards";
import { DisciplineScoreCard } from "@/components/app/DisciplineScoreCard";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function InsightsPage() {
  const { insights } = useAppData();
  const { t } = useLocale();
  const queue = insights.slice(0, 10);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-ink-300">{t.insights.title}</h2>
        <p className="text-sm text-ink-50">{t.insights.sub}</p>
      </header>

      <DisciplineScoreCard />

      <AIInsightCards limit={4} />

      <Card>
        <CardHeader>
          <CardTitle>Full advisor feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-0">
          {queue.map((insight) => (
            <div
              key={insight.id}
              className="flex flex-col gap-2 rounded-2xl border border-snow-300 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      insight.severity === "critical"
                        ? "danger"
                        : insight.severity === "warning"
                          ? "warning"
                          : insight.severity === "positive"
                            ? "success"
                            : "info"
                    }
                  >
                    {insight.category}
                  </Badge>
                  <p className="text-sm font-semibold text-ink-300">
                    {insight.message}
                  </p>
                </div>
                {insight.detail && (
                  <p className="mt-1.5 text-xs text-ink-100 leading-relaxed">
                    {insight.detail}
                  </p>
                )}
              </div>
              {insight.action && (
                <Button size="sm" variant="outline">
                  {insight.action}
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
