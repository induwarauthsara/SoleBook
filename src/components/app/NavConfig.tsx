import {
  LayoutDashboard,
  History,
  Sparkles,
  Lightbulb,
  ArrowLeftRight,
  CalendarClock,
  Wallet,
  CreditCard,
  TrendingUp,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export interface NavItem {
  href: string;
  labelKey: keyof Dictionary["nav2"];
  icon: LucideIcon;
}

export const primaryNav: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/history", labelKey: "history", icon: History },
  { href: "/chat", labelKey: "chat", icon: Sparkles },
  { href: "/insights", labelKey: "insights", icon: Lightbulb },
  { href: "/allocation", labelKey: "allocation", icon: ArrowLeftRight },
  { href: "/obligations", labelKey: "obligations", icon: CalendarClock },
  { href: "/owner-withdrawal", labelKey: "ownerWithdrawal", icon: Wallet },
  { href: "/accounts", labelKey: "accounts", icon: CreditCard },
  { href: "/loan-readiness", labelKey: "loanReadiness", icon: TrendingUp },
  { href: "/settings", labelKey: "settings", icon: Settings },
];
