"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import {
  User,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Info,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { mockOwnerWithdrawals, mockMetrics } from "@/lib/mock-data";
import { cn, formatShortCurrency, formatPercent } from "@/lib/utils";
import { toast } from "sonner";

const salaryGoal = mockMetrics.ownerSalaryGoal;
const totalWithdrawn = mockMetrics.ownerTotalWithdrawn;
const overagePct = ((totalWithdrawn - salaryGoal) / salaryGoal) * 100;
const withdrawnPct = Math.min((totalWithdrawn / salaryGoal) * 100, 150);

function SalaryGauge({ pct }: { pct: number }) {
  const gaugeRef = useRef<SVGCircleElement>(null);
  const circumference = 2 * Math.PI * 54;

  useEffect(() => {
    if (gaugeRef.current) {
      const clampedPct = Math.min(pct, 100);
      const dashOffset = circumference - (clampedPct / 100) * circumference;
      gsap.fromTo(
        gaugeRef.current,
        { strokeDashoffset: circumference },
        { strokeDashoffset: dashOffset, duration: 1.5, ease: "power2.out" }
      );
    }
  }, [pct, circumference]);

  const color =
    pct <= 80 ? "#22C55E" : pct <= 100 ? "#F27344" : "#EF4444";
  const label =
    pct <= 80 ? "Healthy" : pct <= 100 ? "On Track" : "Over Limit";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#2A3F5F"
            strokeWidth="8"
          />
          <circle
            ref={gaugeRef}
            cx="60" cy="60" r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-heading" style={{ color }}>
            {formatPercent(Math.min(pct, 150), 0)}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2 text-center">
        {formatShortCurrency(totalWithdrawn)} of {formatShortCurrency(salaryGoal)} goal
      </p>
    </div>
  );
}

export default function OwnerSalaryPage() {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawals, setWithdrawals] = useState(mockOwnerWithdrawals);

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const newTotal = totalWithdrawn + amount;
    const newPct = (newTotal / salaryGoal) * 100;

    if (newPct > 120) {
      toast.warning("⚠️ Over salary limit", {
        description: `Withdrawing Rs. ${amount.toLocaleString()} puts you ${(newPct - 100).toFixed(0)}% over your monthly goal. This may delay supplier payments.`,
      });
    } else {
      toast.success("Withdrawal recorded", {
        description: `Rs. ${amount.toLocaleString()} owner salary withdrawal tracked.`,
      });
    }

    setWithdrawals((prev) => [
      {
        id: `ow-${Date.now()}`,
        business_id: "biz-001",
        amount,
        date: new Date().toISOString(),
        note: "Owner withdrawal",
      },
      ...prev,
    ]);
    setWithdrawAmount("");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-bright-snow">
          Owner Salary
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pay yourself like an employee. Structured compensation builds financial discipline.
        </p>
      </div>

      {/* Leakage alert */}
      {overagePct > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-warning/30 bg-warning/8 p-4 flex gap-3"
          style={{ background: "rgba(245,158,11,0.06)" }}
        >
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-warning">
              Owner withdrawals exceeded limit by {formatPercent(overagePct, 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You withdrew {formatShortCurrency(totalWithdrawn)} this month against a recommended {formatShortCurrency(salaryGoal)}. 
              This may affect supplier and payroll payments next week.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gauge */}
        <Card className="xl:col-span-1 flex flex-col items-center justify-center py-8">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-6">
            Monthly Withdrawal Health
          </p>
          <SalaryGauge pct={withdrawnPct} />
          <div className="mt-6 grid grid-cols-3 gap-3 w-full px-4">
            {[
              { label: "Safe", range: "0–80%", color: "bg-success" },
              { label: "On Track", range: "80–100%", color: "bg-burnt-peach" },
              { label: "Over Limit", range: ">100%", color: "bg-danger" },
            ].map((zone) => (
              <div key={zone.label} className="text-center">
                <div className={cn("w-3 h-1 rounded-full mx-auto mb-1", zone.color)} />
                <p className="text-[10px] text-muted-foreground font-medium">{zone.label}</p>
                <p className="text-[10px] text-muted-foreground/60">{zone.range}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Stats + Withdraw form */}
        <div className="xl:col-span-2 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Monthly Goal",
                value: formatShortCurrency(salaryGoal),
                icon: User,
                color: "text-burnt-peach",
              },
              {
                label: "Total Withdrawn",
                value: formatShortCurrency(totalWithdrawn),
                icon: TrendingDown,
                color: totalWithdrawn > salaryGoal ? "text-danger" : "text-success",
              },
              {
                label: "Remaining Budget",
                value: formatShortCurrency(Math.max(salaryGoal - totalWithdrawn, 0)),
                icon: TrendingUp,
                color: "text-success",
              },
              {
                label: "Withdrawals",
                value: String(withdrawals.length),
                icon: Info,
                color: "text-muted-foreground",
              },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="p-4">
                  <s.icon className={cn("w-4 h-4 mb-2", s.color)} />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={cn("text-lg font-bold font-heading mt-0.5", s.color)}>
                    {s.value}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-bright-snow">Monthly Salary Progress</p>
                <span className={cn(
                  "text-xs font-bold",
                  totalWithdrawn > salaryGoal ? "text-danger" : "text-success"
                )}>
                  {formatPercent(withdrawnPct, 0)} used
                </span>
              </div>
              <Progress
                value={Math.min(withdrawnPct, 100)}
                indicatorColor={
                  withdrawnPct <= 80
                    ? "bg-success"
                    : withdrawnPct <= 100
                    ? "bg-burnt-peach"
                    : "bg-danger"
                }
                className="h-3"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-muted-foreground">Rs. 0</span>
                <span className="text-xs text-muted-foreground">
                  Goal: {formatShortCurrency(salaryGoal)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Record withdrawal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Record Withdrawal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Amount (Rs.)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <Button onClick={handleWithdraw} className="gap-2 shrink-0">
                  <PlusCircle className="w-4 h-4" /> Record
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended monthly salary: {formatShortCurrency(salaryGoal)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Withdrawal history */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {withdrawals.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 px-6 py-3.5 border-b border-border/50 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-burnt-peach/15 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-burnt-peach" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-bright-snow">
                  {w.note || "Owner withdrawal"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(w.date), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
              <span className="text-sm font-bold text-bright-snow">
                -{formatShortCurrency(w.amount)}
              </span>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
