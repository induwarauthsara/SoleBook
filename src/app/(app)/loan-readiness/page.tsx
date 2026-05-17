"use client";

import { useCallback, useState } from "react";
import { ShieldCheck, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatShortCurrency, getScoreColor } from "@/lib/utils";
import type { LoanReadinessResult } from "@/lib/engine/loan-readiness";
import { messageFromApiBody, readJsonSafe } from "@/lib/api-error";

const RECOMMENDATIONS = [
  "Make the next three salary runs on or before payday to lift payment timeliness.",
  "Hold profit reserve above 15% for two consecutive months — banks weight this heavily.",
  "Document owner withdrawals against a fixed salary, not as ad-hoc transfers.",
  "Keep utility bills on auto-pay; missed utilities are a common red flag in loan reviews.",
];

function safeFileSegment(name: string): string {
  const s = name
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return s || "business";
}

function formatLoanReadinessReportPlainText(
  businessName: string,
  result: LoanReadinessResult,
): string {
  const lines: string[] = [
    "SoleBook — Loan readiness report",
    "",
    `Business: ${businessName.trim() || "(not set)"}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    `Overall score: ${result.score}/100`,
    `Band: ${result.band}`,
    "",
    "Components:",
  ];
  for (const [key, val] of Object.entries(result.components)) {
    lines.push(`  • ${key.replace(/_/g, " ")}: ${val}`);
  }
  lines.push("", "Recommendations:");
  const recs = result.recommendations.length
    ? result.recommendations
    : ["(none — keep current discipline)"];
  for (const r of recs) {
    lines.push(`  • ${r}`);
  }
  return lines.join("\n");
}

function triggerTextDownload(filename: string, body: string) {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function LoanReadinessPage() {
  const { score, business } = useAppData();
  const { session } = useAuth();
  const { t } = useLocale();
  const color = getScoreColor(score.loanReadiness);
  const eligible = Math.round(score.loanReadiness * 28_000);
  const [reportBusy, setReportBusy] = useState(false);

  const handleGenerateReport = useCallback(async () => {
    if (!session?.access_token) {
      toast.error(t.loan.reportGenerateError);
      return;
    }
    setReportBusy(true);
    try {
      const res = await fetch("/api/loan-readiness", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await readJsonSafe(res);
      if (!res.ok) {
        throw new Error(messageFromApiBody(data, t.loan.reportGenerateError));
      }

      const result = data as LoanReadinessResult;
      if (
        typeof result.score !== "number" ||
        !result.components ||
        typeof result.band !== "string"
      ) {
        throw new Error(t.loan.reportGenerateError);
      }

      const text = formatLoanReadinessReportPlainText(business.name, result);
      const stamp = new Date().toISOString().slice(0, 10);
      triggerTextDownload(
        `loan-readiness-${safeFileSegment(business.name)}-${stamp}.txt`,
        text,
      );
      toast.success(t.loan.reportDownloaded);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t.loan.reportGenerateError);
    } finally {
      setReportBusy(false);
    }
  }, [business.name, session, t.loan.reportDownloaded, t.loan.reportGenerateError]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-ink-300">{t.loan.title}</h2>
        <p className="text-sm text-ink-50">{t.loan.sub}</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.loan.score}</CardTitle>
          <span
            className="inline-flex size-9 items-center justify-center rounded-full text-white"
            style={{ background: color }}
          >
            <ShieldCheck className="size-4" />
          </span>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-4xl font-bold font-heading" style={{ color }}>
              {score.loanReadiness}
              <span className="text-base text-ink-50">/100</span>
            </p>
            <Progress
              value={score.loanReadiness}
              className="mt-3 h-2"
              indicatorStyle={{ background: color }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-snow-300 bg-snow-100 p-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-100">
                <TrendingUp className="size-3.5 text-peach-700" />
                {t.loan.eligible}
              </span>
              <p className="mt-1.5 text-2xl font-bold text-ink-300">
                {formatShortCurrency(eligible)}
              </p>
              <p className="mt-0.5 text-xs text-ink-50">
                Based on cash flow & reserve trends.
              </p>
            </div>
            <div className="rounded-2xl border border-snow-300 bg-snow-100 p-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-100">
                <Calendar className="size-3.5 text-peach-700" />
                Recheck cadence
              </span>
              <p className="mt-1.5 text-2xl font-bold text-ink-300">
                Monthly
              </p>
              <p className="mt-0.5 text-xs text-ink-50">
                Score refreshes on the 1st.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.loan.tips}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {RECOMMENDATIONS.map((tip, idx) => (
            <div
              key={tip}
              className="flex items-start gap-3 rounded-2xl border border-snow-300 bg-white p-3"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-peach-50 text-xs font-bold text-peach-700">
                {idx + 1}
              </span>
              <p className="text-sm text-ink-200 leading-relaxed">{tip}</p>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={reportBusy}
            onClick={handleGenerateReport}
          >
            {reportBusy ? t.loan.generatingReport : t.loan.generateReport}
            {!reportBusy ? <ArrowRight className="size-4" /> : null}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
