"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockTransactions } from "@/lib/mock-data";
import { cn, formatShortCurrency } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  Sales: "success",
  Inventory: "warning",
  Salary: "info",
  Utilities: "secondary",
  Transport: "secondary",
  "Owner Salary": "default",
};

export function RecentTransactions() {
  const txns = mockTransactions.slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-burnt-peach">
              Ledger Feed
            </p>
            <CardTitle className="mt-1">Recent Transactions</CardTitle>
          </div>
          <button className="text-xs text-burnt-peach hover:text-burnt-peach-400 transition-colors">
            View all
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div>
          {txns.map((txn, i) => (
            <motion.div
              key={txn.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] transition-colors"
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06]",
                  txn.type === "income"
                    ? "bg-success/15 text-success"
                    : txn.type === "expense"
                    ? "bg-danger/15 text-danger"
                    : "bg-burnt-peach/15 text-burnt-peach"
                )}
              >
                {txn.type === "income" ? (
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                ) : txn.type === "expense" ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-bright-snow truncate">
                  {txn.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(txn.date), "MMM d, yyyy")}
                </p>
              </div>

              {/* Category */}
              <Badge
                variant={(categoryColors[txn.category] as any) || "secondary"}
                className="shrink-0 hidden sm:flex"
              >
                {txn.category}
              </Badge>

              {/* Amount */}
              <span
                className={cn(
                  "text-sm font-bold shrink-0",
                  txn.type === "income" ? "text-success" : "text-bright-snow"
                )}
              >
                {txn.type === "income" ? "+" : txn.type === "expense" ? "-" : ""}
                {formatShortCurrency(txn.amount)}
              </span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
