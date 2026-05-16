"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockMetrics, mockInsights } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { formatShortCurrency } from "@/lib/utils";

const criticalInsights = mockInsights.filter((i) => i.severity === "critical" || i.severity === "warning");

export function Header() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#050812]/80 backdrop-blur-xl flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Find a payment, bucket, or risk..."
            className="w-full h-9 bg-white/[0.035] border border-white/[0.08] rounded-full pl-9 pr-4 text-sm text-bright-snow placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-burnt-peach/40 focus:border-burnt-peach/50 transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Balance pill */}
        <div className="hidden md:flex items-center gap-2 bg-white/[0.035] border border-white/[0.08] rounded-full px-4 py-2 mr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">Balance</span>
          <span className="text-sm font-bold text-bright-snow">
            {formatShortCurrency(mockMetrics.currentBalance)}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {criticalInsights.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-burnt-peach border border-prussian-blue" />
            )}
          </Button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/[0.08] bg-[#0B1120] shadow-card-hover z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-white/[0.08]">
                  <p className="font-semibold text-bright-snow text-sm">Notifications</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{criticalInsights.length} alerts need attention</p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {criticalInsights.map((insight) => (
                    <div key={insight.id} className="p-4 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          insight.severity === "critical" ? "bg-danger" : "bg-warning"
                        )} />
                        <div>
                          <p className="text-sm text-bright-snow font-medium">{insight.message}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/[0.045] transition-colors duration-200"
          >
            <div className="w-7 h-7 rounded-full bg-burnt-peach/20 border border-burnt-peach/40 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-burnt-peach" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-bright-snow leading-none">Nimal</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Nimal&apos;s Retail Store</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/[0.08] bg-[#0B1120] shadow-card-hover z-50 overflow-hidden"
              >
                <div className="p-2">
                  <button className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-bright-snow hover:bg-white/[0.045] transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside to close */}
      {(notifOpen || profileOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setNotifOpen(false); setProfileOpen(false); }}
        />
      )}
    </header>
  );
}
