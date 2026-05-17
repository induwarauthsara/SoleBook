"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, LogOut, Settings, User } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Avatar } from "@/components/ui/Avatar";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAppData } from "@/components/providers/AppDataProvider";
import { cn } from "@/lib/utils";
import { primaryNav } from "./NavConfig";
import {
  clearStoredOnboardingRegistrationState,
  isDemoAccountEmail,
} from "@/lib/demo-account";

interface AppHeaderProps {
  onOpenMobileNav: () => void;
}

export function AppHeader({ onOpenMobileNav }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const { user, session, signOut } = useAuth();
  const { insights } = useAppData();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = primaryNav.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href)),
  );
  const pageTitle = current ? t.nav2[current.labelKey] : t.dashboard.title;

  const criticalInsights = insights.filter(
    (i) => i.severity === "critical" || i.severity === "warning",
  );

  const isDemoUser = isDemoAccountEmail(user?.email);

  const goToRegisterFromDemo = async () => {
    if (creatingAccount) return;
    setCreatingAccount(true);
    try {
      if (session?.access_token) {
        await fetch("/api/demo/reset-sandbox", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }).catch(() => {});
      }
      await signOut();
      clearStoredOnboardingRegistrationState();
      router.push("/register");
    } finally {
      setCreatingAccount(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-snow-300 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="inline-flex size-10 items-center justify-center rounded-lg text-ink-100 hover:bg-snow-100 hover:text-ink-300 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-base font-semibold text-ink-300">
          {pageTitle}
        </h1>
        <p className="truncate text-xs text-ink-50 hidden sm:block">
          {t.dashboard.subtitle}
        </p>
      </div>

      {isDemoUser && (
        <button
          type="button"
          disabled={creatingAccount}
          onClick={() => void goToRegisterFromDemo()}
          className="inline-flex h-11 max-w-[11rem] shrink-0 items-center justify-center rounded-2xl bg-peach-500 px-4 text-xs font-bold tracking-tight text-white shadow-md transition hover:bg-peach-600 disabled:opacity-70 sm:max-w-none sm:px-7 sm:text-base"
        >
          {creatingAccount ? t.common.loading : t.auth.signUp}
        </button>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="hidden sm:block">
          <LanguageSwitcher tone="light" />
        </div>

        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative inline-flex size-10 items-center justify-center rounded-full text-ink-100 hover:bg-snow-100 hover:text-ink-300"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            {criticalInsights.length > 0 && (
              <span className="absolute right-2 top-2 size-2 rounded-full bg-peach-500 ring-2 ring-white" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-snow-300 bg-white shadow-xl">
              <div className="border-b border-snow-300 px-4 py-3">
                <p className="text-sm font-semibold text-ink-300">
                  Notifications
                </p>
                <p className="text-xs text-ink-50">
                  {criticalInsights.length} alert
                  {criticalInsights.length === 1 ? "" : "s"} need attention
                </p>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {criticalInsights.map((insight) => (
                  <li
                    key={insight.id}
                    className="border-b border-snow-200 px-4 py-3 last:border-0 hover:bg-snow-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          insight.severity === "critical"
                            ? "bg-[#EF4444]"
                            : "bg-[#F59E0B]",
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium text-ink-300">
                          {insight.message}
                        </p>
                        {insight.detail && (
                          <p className="mt-1 text-xs text-ink-50 line-clamp-2">
                            {insight.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-full px-1 py-1 hover:bg-snow-100"
            aria-label="Account menu"
          >
            <Avatar
              name={user?.name ?? "Owner"}
              color={user?.avatarColor ?? "#F27344"}
              size={32}
            />
            <span className="hidden md:block text-left text-xs font-semibold text-ink-300 leading-tight">
              {user?.name ?? "Owner"}
            </span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-snow-300 bg-white shadow-xl">
              <div className="border-b border-snow-200 px-4 py-3">
                <p className="text-sm font-semibold text-ink-300">
                  {user?.name ?? "Owner"}
                </p>
                <p className="text-xs text-ink-50 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-snow-100"
                >
                  <User className="size-4" /> {t.settings.sections.profile}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-snow-100"
                >
                  <Settings className="size-4" /> {t.nav2.settings}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#B91C1C] hover:bg-[#FEE2E2]"
                >
                  <LogOut className="size-4" /> {t.nav2.signOut}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
