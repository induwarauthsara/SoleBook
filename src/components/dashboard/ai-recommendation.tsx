"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatShortCurrency } from "@/lib/utils";
import { toast } from "sonner";

const recommendation = {
  amount: 185000,
  splits: [
    { label: "Operations", pct: 50, amount: 92500, color: "#3B82F6" },
    { label: "Obligations", pct: 28, amount: 51800, color: "#F59E0B" },
    { label: "Profit Reserve", pct: 12, amount: 22200, color: "#22C55E" },
    { label: "Owner Salary", pct: 8, amount: 14800, color: "#F27344" },
    { label: "Growth", pct: 2, amount: 3700, color: "#8B5CF6" },
  ],
  reasoning:
    "Obligation coverage is low. Increased obligations allocation to cover upcoming rent & salary.",
  riskLevel: "caution" as const,
};

export function AIRecommendation() {
  const [dismissed, setDismissed] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    toast.success("Allocation accepted", {
      description: `Rs. ${recommendation.amount.toLocaleString()} allocated across 5 buckets.`,
    });
    setTimeout(() => setDismissed(true), 2000);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16, scale: 0.95 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-[1.5rem] border border-burnt-peach/30 bg-burnt-peach/10"
        style={{ background: "linear-gradient(145deg, rgba(242,115,68,0.12) 0%, rgba(8,13,26,0.96) 48%, rgba(17,24,39,0.96) 100%)" }}
      >
        {/* Glow line top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-burnt-peach/60 to-transparent" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-burnt-peach/20 border border-burnt-peach/20">
                <Sparkles className="w-4 h-4 text-burnt-peach" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-burnt-peach">
                  Explainable AI
                </p>
                <p className="text-sm font-semibold text-bright-snow">Reserve this payment before spending</p>
                <p className="text-xs text-muted-foreground">
                  New payment: {formatShortCurrency(recommendation.amount)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-bright-snow transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Reasoning */}
          <p className="text-xs text-muted-foreground mb-4 border-l border-burnt-peach/40 pl-3">
            &ldquo;{recommendation.reasoning}&rdquo;
          </p>

          {/* Split bars */}
          <div className="space-y-2 mb-5">
            {recommendation.splits.map((split, i) => (
              <motion.div
                key={split.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3"
              >
                <div className="w-24 text-xs text-muted-foreground shrink-0">{split.label}</div>
                <div className="flex-1 h-2 bg-white/[0.055] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${split.pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.07 + 0.2, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: split.color }}
                  />
                </div>
                <span className="text-xs font-medium text-bright-snow w-20 text-right shrink-0">
                  {formatShortCurrency(split.amount)}
                </span>
                <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                  {split.pct}%
                </span>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              size="sm"
              className="flex-1 gap-2"
              disabled={accepted}
            >
              {accepted ? (
                <>
                  <CheckCircle className="w-4 h-4" /> Accepted!
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Accept
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Adjust
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
