import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-snow-100">
      <div className="hue-orange pointer-events-none absolute inset-0 opacity-30" />
      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="SoleBook home">
          <Logo />
        </Link>
        <p className="text-xs text-ink-50 hidden sm:block">
          Built for Sri Lankan SMEs
        </p>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
        {children}
      </main>
    </div>
  );
}
