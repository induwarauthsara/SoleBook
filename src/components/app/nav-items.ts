import {
  LayoutDashboard,
  Receipt,
  MessagesSquare,
  Sparkles,
  PieChart,
  CalendarClock,
  UserCog,
  Wallet,
  GaugeCircle,
  Settings,
  Code2,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export interface AppNavItem {
  href: string;
  icon: LucideIcon;
  /** path into `t.nav2` */
  labelKey: keyof Dictionary["nav2"];
  /** Optional notification badge */
  badge?: number;
}

export const primaryNav: AppNavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/history", icon: Receipt, labelKey: "history" },
  { href: "/chat", icon: MessagesSquare, labelKey: "chat" },
  { href: "/insights", icon: Sparkles, labelKey: "insights", badge: 2 },
  { href: "/allocation", icon: PieChart, labelKey: "allocation" },
  {
    href: "/obligations",
    icon: CalendarClock,
    labelKey: "obligations",
    badge: 3,
  },
  { href: "/owner-withdrawal", icon: UserCog, labelKey: "ownerWithdrawal" },
  { href: "/accounts", icon: Wallet, labelKey: "accounts" },
  { href: "/loan-readiness", icon: GaugeCircle, labelKey: "loanReadiness" },
];

export const secondaryNav: AppNavItem[] = [
  { href: "/developer", icon: Code2, labelKey: "developer" },
  { href: "/settings", icon: Settings, labelKey: "settings" },
];
