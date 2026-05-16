"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppDataProvider } from "@/components/providers/AppDataProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppShell } from "@/components/app/AppShell";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-snow-100">
        <div className="size-8 rounded-full border-2 border-peach-500 border-r-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Brief blank while we redirect — avoids a flash of the shell.
    return null;
  }

  return (
    <AppDataProvider>
      <AppShell>{children}</AppShell>
    </AppDataProvider>
  );
}
