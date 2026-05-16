"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  SlidersHorizontal,
  History,
  Briefcase,
  AlertCircle,
  Shield,
  User,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockTransactions } from "@/lib/mock-data";
import { computeAllocation } from "@/lib/finance/allocation-engine";
import { mockObligations, mockMetrics } from "@/lib/mock-data";
import { formatShortCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const bucketMeta = {
  operations: { label: "Operations", icon: Briefcase, color: "#3B82F6" },
  obligations: { label: "Obligations", icon: AlertCircle, color: "#F59E0B" },
  reserve: { label: "Profit Reserve", icon: Shield, color: "#22C55E" },
  owner_salary: { label: "Owner Salary", icon: User, color: "#F27344" },
  growth: { label: "Growth", icon: TrendingUp, color: "#8B5CF6" },
};

export default function AllocationPage() {
  const [amount, setAmount] = useState("");
  const [computed, setComputed] = useState(false);
  const [adjustMode, setAdjustMode] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const counterRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const result = computeAllocation({
    amount: parseFloat(amount) || 100000,
    businessType: "retail",
    upcomingObligations: mockObligations,
    currentReserveBalance: 95000,
    monthlyRevenueTrend: "growing",
    ownerSalaryGoal: mockMetrics.ownerSalaryGoal,
  });

  const handleCompute = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    setComputed(true);
    setAccepted(false);
    setAdjustMode(false);

    setTimeout(() => {
      result.splits.forEach((split) => {
        const el = counterRefs.current[split.bucket];
        if (el) {
          gsap.fromTo(
            el,
            { textContent: "0" },
            {
              textContent: split.amount,
              duration: 1,
              ease: "power2.out",
              snap: { textContent: 1 },
              onUpdate: function () {
                if (el) el.textContent = `Rs. ${Math.round(parseFloat(el.textContent || "0")).toLocaleString()}`;
              },
            }
          );
        }
      });
    }, 300);
  };

  const handleAccept = () => {
    setAccepted(true);
    toast.success("Allocation confirmed", {
      description: `${formatShortCurrency(parseFloat(amount))} allocated across 5 smart buckets.`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-bright-snow">Cash Allocation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter an incoming payment and let AI recommend the optimal split.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Input & compute */}
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>New Payment Received</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-2">
                  Payment Amount (Rs.)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="e.g. 185000"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setComputed(false); }}
                    className="text-lg font-semibold"
                  />
                  <Button onClick={handleCompute} className="shrink-0 gap-2">
                    <Sparkles className="w-4 h-4" /> Allocate
                  </Button>
                </div>
              </div>

              {/* Quick amounts */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick amounts</p>
                <div className="flex flex-wrap gap-2">
                  {[50000, 100000, 185000, 250000, 500000].map((v) => (
                    <button
                      key={v}
                      onClick={() => { setAmount(String(v)); setComputed(false); }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-burnt-peach/50 hover:bg-burnt-peach/10 text-muted-foreground hover:text-burnt-peach transition-all duration-200"
                    >
                      Rs. {(v / 1000).toFixed(0)}K
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI reasoning */}
          <AnimatePresence>
            {computed && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <Card className="border-burnt-peach/25" style={{ background: "linear-gradient(135deg, rgba(242,115,68,0.06) 0%, rgba(30,41,59,0.9) 100%)" }}>
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-1.5 rounded-lg bg-burnt-peach/20 shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-burnt-peach" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-burnt-peach mb-1">AI Reasoning</p>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                          &ldquo;{result.reasoning}&rdquo;
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "text-xs font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5",
                      result.riskLevel === "safe"
                        ? "bg-success/10 text-success border border-success/20"
                        : result.riskLevel === "caution"
                        ? "bg-warning/10 text-warning border border-warning/20"
                        : "bg-danger/10 text-danger border border-danger/20"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", result.riskLevel === "safe" ? "bg-success" : result.riskLevel === "caution" ? "bg-warning" : "bg-danger")} />
                      {result.riskLevel === "safe" ? "Safe allocation" : result.riskLevel === "caution" ? "Caution advised" : "High risk — review"}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Split visualization */}
        <div className="xl:col-span-3">
          <AnimatePresence mode="wait">
            {!computed ? (
              <motion.div
                key="empty"
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center"
              >
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                    <ArrowRight className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Enter an amount to see AI allocation</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">AI will analyze your business and upcoming obligations</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recommended Split</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAdjustMode(!adjustMode)}
                          className="gap-1.5 text-xs"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          {adjustMode ? "Done" : "Adjust"}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatShortCurrency(parseFloat(amount))}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.splits.map((split, i) => {
                      const meta = bucketMeta[split.bucket];
                      const Icon = meta.icon;
                      return (
                        <motion.div
                          key={split.bucket}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${meta.color}20` }}>
                                <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                              </div>
                              <span className="text-sm font-medium text-bright-snow">{meta.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{split.pct.toFixed(0)}%</span>
                              <span
                                ref={(el) => { counterRefs.current[split.bucket] = el; }}
                                className="text-sm font-bold text-bright-snow w-24 text-right"
                              >
                                {formatShortCurrency(split.amount)}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-border rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${split.pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 + 0.2, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: meta.color }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleAccept}
                        className="flex-1 gap-2"
                        disabled={accepted}
                      >
                        {accepted ? (
                          <><CheckCircle className="w-4 h-4" /> Accepted!</>
                        ) : (
                          <><CheckCircle className="w-4 h-4" /> Accept Allocation</>
                        )}
                      </Button>
                      <Button variant="outline" size="default" className="gap-2">
                        <SlidersHorizontal className="w-4 h-4" /> Adjust
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <CardTitle>Allocation History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {mockTransactions
            .filter((t) => t.type === "income")
            .slice(0, 4)
            .map((txn, i) => (
              <div
                key={txn.id}
                className="flex items-center gap-4 px-6 py-3.5 border-b border-border/50 last:border-0 hover:bg-surface-elevated transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-bright-snow">{txn.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(txn.date), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
                <span className="text-sm font-bold text-success">
                  +{formatShortCurrency(txn.amount)}
                </span>
                <Badge variant="success" className="text-xs">Allocated</Badge>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
