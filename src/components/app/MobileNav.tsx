"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { primaryNav } from "./NavConfig";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { signOut } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Logo size={28} />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {primaryNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-peach-50 text-peach-700"
                        : "text-ink-100 hover:bg-snow-100 hover:text-ink-300",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4",
                        active ? "text-peach-600" : "text-ink-50",
                      )}
                    />
                    <span>{t.nav2[item.labelKey]}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-snow-300 p-4 space-y-3">
          <LanguageSwitcher tone="light" />
          <button
            type="button"
            onClick={() => {
              signOut();
              onOpenChange(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-100 hover:bg-snow-100 hover:text-ink-300 transition-colors"
          >
            <LogOut className="size-4" />
            <span>{t.nav2.signOut}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
