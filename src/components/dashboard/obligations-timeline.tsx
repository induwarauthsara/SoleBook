"use client";

import React from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockObligations } from "@/lib/mock-data";
import { cn, formatShortCurrency, getDaysUntil, getUrgencyBg } from "@/lib/utils";

export function ObligationsTimeline() {
  const upcoming = mockObligations
    .filter((o) => o.status === "pending")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-burnt-peach">
              Payment Discipline
            </p>
            <CardTitle className="mt-1">Upcoming Obligations</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Next {upcoming.length} payments due
            </p>
          </div>
          <span className="text-xs bg-danger/10 text-danger border border-danger/20 rounded-full px-2.5 py-1 font-medium">
            {upcoming.filter((o) => getDaysUntil(o.due_date) <= 7).length} urgent
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {upcoming.map((ob, i) => {
            const days = getDaysUntil(ob.due_date);
            return (
              <motion.div
                key={ob.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "flex-shrink-0 w-44 rounded-2xl border p-3 shadow-[inset_0_1px_0_rgba(248,250,252,0.04)]",
                  getUrgencyBg(days)
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant={
                      ob.priority === "HIGH"
                        ? "high"
                        : ob.priority === "MEDIUM"
                        ? "medium"
                        : "low"
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {ob.priority}
                  </Badge>
                  <span
                    className={cn(
                      "text-[10px] font-semibold",
                      days <= 3
                        ? "text-danger"
                        : days <= 7
                        ? "text-warning"
                        : "text-success"
                    )}
                  >
                    {days === 0
                      ? "Today"
                      : days === 1
                      ? "Tomorrow"
                      : `${days}d`}
                  </span>
                </div>
                <p className="text-xs font-semibold text-bright-snow mb-1 leading-tight">
                  {ob.name}
                </p>
                <p className="text-sm font-bold text-bright-snow">
                  {formatShortCurrency(ob.amount)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {format(parseISO(ob.due_date), "MMM d")}
                </p>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
