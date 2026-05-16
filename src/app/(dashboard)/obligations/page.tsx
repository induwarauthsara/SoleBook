"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  CheckCircle,
  Plus,
  Filter,
  CalendarClock,
  AlertTriangle,
  Clock,
  CheckCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockObligations, mockMetrics } from "@/lib/mock-data";
import {
  cn,
  formatShortCurrency,
  getDaysUntil,
  getPriorityBg,
} from "@/lib/utils";
import { toast } from "sonner";
import type { Obligation } from "@/types";

const totalDue = mockObligations
  .filter((o) => o.status === "pending")
  .reduce((s, o) => s + o.amount, 0);

const reserveBalance = mockMetrics.currentBalance * 0.3;
const coveragePct = Math.min((reserveBalance / totalDue) * 100, 100);

function ObligationCard({
  obligation,
  onPay,
}: {
  obligation: Obligation;
  onPay: (id: string) => void;
}) {
  const days = getDaysUntil(obligation.due_date);
  const isPaid = obligation.status === "paid";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isPaid ? 0.5 : 1, y: 0 }}
      className={cn(
        "rounded-xl border p-4 transition-all duration-300",
        isPaid
          ? "border-border/50 bg-surface/50"
          : getPriorityBg(obligation.priority)
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-semibold text-bright-snow">
              {obligation.name}
            </span>
            {obligation.recurring && (
              <span className="text-[10px] text-muted-foreground bg-surface border border-border px-1.5 py-0.5 rounded-full">
                Recurring
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant={
                obligation.priority === "HIGH"
                  ? "high"
                  : obligation.priority === "MEDIUM"
                  ? "medium"
                  : "low"
              }
            >
              {obligation.priority}
            </Badge>
            <span className="text-xs text-muted-foreground">{obligation.category}</span>
            <span
              className={cn(
                "text-xs font-medium flex items-center gap-1",
                days <= 3
                  ? "text-danger"
                  : days <= 7
                  ? "text-warning"
                  : "text-muted-foreground"
              )}
            >
              <Clock className="w-3 h-3" />
              {isPaid
                ? "Paid"
                : days === 0
                ? "Due today"
                : days < 0
                ? `${Math.abs(days)}d overdue`
                : `Due in ${days}d`}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-bright-snow">
            {formatShortCurrency(obligation.amount)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(parseISO(obligation.due_date), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      {!isPaid && (
        <div className="flex justify-end mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPay(obligation.id)}
            className="gap-1.5 text-xs"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default function ObligationsPage() {
  const [obligations, setObligations] = useState(mockObligations);
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");

  const handlePay = (id: string) => {
    setObligations((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "paid" as const } : o))
    );
    toast.success("Obligation marked as paid");
  };

  const filtered = obligations
    .filter((o) => filter === "all" || o.status === filter)
    .sort(
      (a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );

  const pending = obligations.filter((o) => o.status === "pending");
  const paid = obligations.filter((o) => o.status === "paid");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-bright-snow">
            Obligations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track, prioritize, and settle upcoming business payments.
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add Obligation
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Due",
            value: formatShortCurrency(totalDue),
            icon: CalendarClock,
            color: "text-bright-snow",
            bg: "bg-surface",
          },
          {
            label: "Urgent (≤7 days)",
            value: String(pending.filter((o) => getDaysUntil(o.due_date) <= 7).length),
            icon: AlertTriangle,
            color: "text-danger",
            bg: "bg-danger/10 border-danger/20",
          },
          {
            label: "Pending",
            value: String(pending.length),
            icon: Clock,
            color: "text-warning",
            bg: "bg-warning/10 border-warning/20",
          },
          {
            label: "Paid this month",
            value: String(paid.length),
            icon: CheckCheck,
            color: "text-success",
            bg: "bg-success/10 border-success/20",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className={cn("p-4 border", stat.bg)}>
              <div className="flex items-center gap-3">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-xl font-bold font-heading", stat.color)}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Reserve coverage */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-bright-snow">
                Obligations Reserve Coverage
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatShortCurrency(reserveBalance)} reserved vs {formatShortCurrency(totalDue)} due
              </p>
            </div>
            <span
              className={cn(
                "text-sm font-bold",
                coveragePct >= 100
                  ? "text-success"
                  : coveragePct >= 60
                  ? "text-warning"
                  : "text-danger"
              )}
            >
              {coveragePct.toFixed(0)}% covered
            </span>
          </div>
          <Progress
            value={coveragePct}
            indicatorColor={
              coveragePct >= 100
                ? "bg-success"
                : coveragePct >= 60
                ? "bg-warning"
                : "bg-danger"
            }
            className="h-2.5"
          />
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "paid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize",
              filter === f
                ? "bg-burnt-peach text-white"
                : "bg-surface border border-border text-muted-foreground hover:text-bright-snow"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Obligations list */}
      <div className="space-y-3">
        {filtered.map((ob) => (
          <ObligationCard key={ob.id} obligation={ob} onPay={handlePay} />
        ))}
      </div>
    </div>
  );
}
