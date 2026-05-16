"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CalendarClock,
  UserCircle,
  Lightbulb,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockMetrics } from "@/lib/mock-data";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & health",
  },
  {
    label: "Allocation",
    href: "/allocation",
    icon: ArrowLeftRight,
    description: "AI cash allocation",
  },
  {
    label: "Obligations",
    href: "/obligations",
    icon: CalendarClock,
    description: "Upcoming payments",
    badge: 3,
  },
  {
    label: "Owner Salary",
    href: "/owner-salary",
    icon: UserCircle,
    description: "Personal compensation",
  },
  {
    label: "AI Insights",
    href: "/insights",
    icon: Lightbulb,
    description: "Smart analysis",
    badge: 2,
  },
];

const bottomItems = [
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (v: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const toggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onCollapse?.(next);
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative z-20 flex flex-col h-full bg-[#050812]/95 border-r border-white/[0.08] shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-burnt-peach flex items-center justify-center shrink-0 shadow-[0_0_24px_rgba(242,115,68,0.34)]">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <span className="font-heading font-bold text-bright-snow text-lg tracking-tight">
                  Sole<span className="text-burnt-peach">Book</span>
                </span>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Control Layer
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Discipline score pill */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 border-b border-white/[0.08]"
          >
            <div className="rounded-2xl bg-white/[0.035] border border-white/[0.08] p-3 flex items-center gap-3">
              <div className="relative w-10 h-10 shrink-0">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#2A3F5F" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke="#F27344" strokeWidth="3"
                    strokeDasharray={`${(mockMetrics.disciplineScore / 100) * 87.96} 87.96`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-burnt-peach">
                  {mockMetrics.disciplineScore}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Discipline Score</p>
                <p className="text-sm font-semibold text-bright-snow">Good</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: isCollapsed ? 0 : 4 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-burnt-peach/10 text-burnt-peach border border-burnt-peach/30"
                    : "text-muted-foreground hover:text-bright-snow hover:bg-white/[0.045]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-burnt-peach rounded-full"
                  />
                )}
                <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-burnt-peach")} />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 min-w-0 flex items-center justify-between"
                    >
                      <span className="text-sm font-medium truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-burnt-peach text-[10px] font-bold text-white px-1">
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {isCollapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-burnt-peach" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 border-t border-white/[0.08] pt-3 space-y-1">
        {bottomItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:text-bright-snow hover:bg-white/[0.045] transition-all duration-200 cursor-pointer">
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </Link>
        ))}

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground hover:text-bright-snow hover:bg-white/[0.045] transition-all duration-200"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
