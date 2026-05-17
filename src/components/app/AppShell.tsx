"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { AppHeader } from "./AppHeader";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { Button } from "@/components/ui/Button";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { error, isLoading, refresh } = useAppData();
  const { t } = useLocale();

  return (
    <div className="flex h-dvh bg-snow-100 overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {error && (
              <div
                role="alert"
                className="mb-4 flex flex-col gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B] sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="min-w-0 flex-1">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-[#FECACA] bg-white text-[#991B1B] hover:bg-[#FEE2E2]"
                  onClick={() => void refresh()}
                  disabled={isLoading}
                >
                  {t.common.retry}
                </Button>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
