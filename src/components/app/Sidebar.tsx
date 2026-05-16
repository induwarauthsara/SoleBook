"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { primaryNav } from "./NavConfig";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <aside
      className={cn(
        "relative hidden lg:flex h-full flex-col shrink-0 border-r border-snow-300 bg-white",
        "transition-[width] duration-300 ease-out",
        collapsed ? "w-[76px]" : "w-64",
      )}
      aria-label="Primary navigation"
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-snow-300",
          collapsed ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        {collapsed ? (
          <Logo size={32} showWordmark={false} />
        ) : (
          <Logo size={32} />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {primaryNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const isAllocation = item.href === "/allocation";
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-peach-50 text-peach-700"
                      : isAllocation
                        ? "bg-peach-500/10 text-peach-700 hover:bg-peach-100"
                        : "text-ink-100 hover:bg-snow-100 hover:text-ink-300",
                  )}
                  title={collapsed ? t.nav2[item.labelKey] : undefined}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-peach-600" : isAllocation ? "text-peach-500" : "text-ink-50",
                    )}
                  />
                  {!collapsed && <span>{t.nav2[item.labelKey]}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        onClick={onToggle}
        className="m-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-snow-300 bg-white text-xs font-medium text-ink-100 hover:bg-snow-100 hover:text-ink-300 transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="size-4" />
        ) : (
          <>
            <ChevronLeft className="size-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}
