"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

const PENDING_2FA_KEY = "solebook.pending2fa";

type Pending = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

function readPending(): Pending | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_2FA_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Pending>;
    if (
      typeof v.access_token === "string" &&
      typeof v.refresh_token === "string" &&
      v.access_token.length > 0 &&
      v.refresh_token.length > 0
    ) {
      return {
        access_token: v.access_token,
        refresh_token: v.refresh_token,
        expires_at: typeof v.expires_at === "number" ? v.expires_at : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function TwoFactorPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { verify2FA, isLoading } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    setPending(readPending());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const p = pending ?? readPending();
    if (!p) {
      setError("Sign-in session expired. Start again from the login page.");
      return;
    }
    try {
      await verify2FA(p.access_token, code.trim(), p.refresh_token);
      try {
        window.sessionStorage.removeItem(PENDING_2FA_KEY);
      } catch {
        /* ignore */
      }
      const hasOnboarded = window.localStorage.getItem("solebook.onboarded");
      router.push(hasOnboarded === "true" ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    }
  };

  return (
    <Card className="w-full max-w-md" padded={false}>
      <CardHeader>
        <p className="text-[11px] uppercase tracking-[0.22em] text-peach-700">
          {t.settings.security.twoFactor}
        </p>
        <CardTitle className="mt-1.5 text-2xl">Enter your code</CardTitle>
        <p className="text-sm text-ink-50">
          Open your authenticator app and enter the 6-digit code.
        </p>
      </CardHeader>
      <CardContent>
        {!pending ? (
          <div
            role="alert"
            className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B]"
          >
            No pending sign-in found.{" "}
            <Link href="/login" className="font-semibold underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B]"
              >
                {error}
              </div>
            )}
            <label className="block">
              <span className="text-xs font-medium text-ink-100">
                Authentication code
              </span>
              <div className="relative mt-1">
                <Shield className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-50" />
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={code}
                  onChange={(e) => {
                    setError(null);
                    setCode(e.target.value.replace(/\s/g, ""));
                  }}
                  className="pl-9 tracking-widest"
                  placeholder="000000"
                  required
                />
              </div>
            </label>
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {t.auth.submit}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
