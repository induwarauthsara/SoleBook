"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getScoreColor, getScoreLabel } from "@/lib/utils";

export function DisciplineScoreCard() {
  const { score } = useAppData();
  const { t } = useLocale();
  const color = getScoreColor(score.overall);

  /** `penalty`: negative score component; map to 0–100 bar by magnitude (max −15). */
  const rows: { label: string; value: number; kind?: "penalty" }[] = [
    { label: t.score.timeliness, value: score.paymentTimeliness },
    { label: t.score.reserve, value: score.reserveConsistency },
    { label: t.score.salary, value: score.salaryStability },
    { label: t.score.leakage, value: score.personalLeakage, kind: "penalty" },
    { label: t.score.loan, value: score.loanReadiness },
  ];

  // Use a clean SVG ring instead of a chart library — fewer surprises.
  const radius = 52;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const dash = (score.overall / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.score.title}</CardTitle>
        <p className="text-xs text-ink-50">{t.score.sub}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative grid size-32 place-items-center shrink-0">
            <svg width={128} height={128} className="-rotate-90">
              <circle
                cx={64}
                cy={64}
                r={radius}
                stroke="#E2E8F0"
                strokeWidth={stroke}
                fill="none"
              />
              <circle
                cx={64}
                cy={64}
                r={radius}
                stroke={color}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                style={{ transition: "stroke-dasharray 700ms ease" }}
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-3xl font-bold font-heading text-ink-300">
                {score.overall}
              </p>
              <p className="text-xs font-semibold" style={{ color }}>
                {getScoreLabel(score.overall)}
              </p>
            </div>
          </div>

          <div className="flex-1 w-full space-y-3">
            {rows.map((row) => {
              const barValue =
                row.kind === "penalty"
                  ? Math.min(
                      100,
                      (Math.abs(Math.min(0, row.value)) / 15) * 100,
                    )
                  : Math.max(0, Math.min(100, row.value));
              const barColor =
                row.kind === "penalty"
                  ? barValue > 50
                    ? "#EF4444"
                    : "#F59E0B"
                  : getScoreColor(row.value);
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-100">{row.label}</span>
                    <span className="font-semibold text-ink-300">
                      {row.value}
                    </span>
                  </div>
                  <Progress
                    value={barValue}
                    className="mt-1.5 h-1.5"
                    indicatorStyle={{ background: barColor }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
