"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { clearStoredOnboardingRegistrationState } from "@/lib/demo-account";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { signUp, signIn, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signUp({
        email,
        password,
        full_name: name,
        business_name: name || "My Business",
        business_type: "other",
      });
      clearStoredOnboardingRegistrationState();
      try {
        const login = await signIn(email, password);
        if (login.requires_2fa && login.session_token && login.refresh_token) {
          try {
            window.sessionStorage.setItem(
              "solebook.pending2fa",
              JSON.stringify({
                access_token: login.session_token,
                refresh_token: login.refresh_token,
                expires_at: login.expires_at,
              }),
            );
          } catch {
            /* ignore */
          }
          router.push("/auth/2fa");
          return;
        }
        if (login.requires_2fa) {
          setError(
            "Two-factor sign-in is missing session data. Try logging in from the login page.",
          );
          return;
        }
        router.push("/onboarding");
      } catch (signInErr) {
        setError(
          signInErr instanceof Error
            ? signInErr.message
            : "Account was created but we could not sign you in automatically. Try logging in.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed. Try again.",
      );
    }
  };

  return (
    <Card className="w-full max-w-md" padded={false}>
      <CardHeader>
        <p className="text-[11px] uppercase tracking-[0.22em] text-peach-700">
          {t.auth.signUp}
        </p>
        <CardTitle className="mt-1.5 text-2xl">{t.auth.welcomeNew}</CardTitle>
        <p className="text-sm text-ink-50">{t.auth.newDetails}</p>
      </CardHeader>
      <CardContent>
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
            <span className="text-xs font-medium text-ink-100">Your name</span>
            <div className="relative mt-1">
              <UserIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-50" />
              <Input
                value={name}
                onChange={(e) => {
                  setError(null);
                  setName(e.target.value);
                }}
                className="pl-9"
                placeholder="Nimal Perera"
                required
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-100">
              {t.auth.email}
            </span>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-50" />
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setError(null);
                  setEmail(e.target.value);
                }}
                className="pl-9"
                placeholder="you@business.lk"
                required
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-100">
              {t.auth.password}
            </span>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-50" />
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setError(null);
                  setPassword(e.target.value);
                }}
                className="pl-9"
                placeholder="Pick a strong password"
                required
              />
            </div>
          </label>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {t.auth.submit}
            <ArrowRight className="size-4" />
          </Button>

          <p className="pt-2 text-center text-xs text-ink-50">
            {t.auth.haveAccount}{" "}
            <Link
              href="/login"
              className="font-semibold text-peach-700 hover:text-peach-600"
            >
              {t.auth.signIn}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
