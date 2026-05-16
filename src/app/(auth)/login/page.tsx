"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("nimal@nilamart.lk");
  const [password, setPassword] = useState("demo-password");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await signIn(email, password);
      if (result.requires_2fa) {
        router.push(`/auth/2fa?token=${result.session_token}`);
      } else {
        const hasOnboarded = window.localStorage.getItem("solebook.onboarded");
        router.push(hasOnboarded === "true" ? "/dashboard" : "/onboarding");
      }
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md" padded={false}>
      <CardHeader>
        <p className="text-[11px] uppercase tracking-[0.22em] text-peach-700">
          {t.auth.signIn}
        </p>
        <CardTitle className="mt-1.5 text-2xl">{t.auth.welcome}</CardTitle>
        <p className="text-sm text-ink-50">{t.auth.enterDetails}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-ink-100">
              {t.auth.email}
            </span>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-50" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </label>

          <div className="flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-2 text-ink-100">
              <input
                type="checkbox"
                className="size-4 accent-peach-500"
                defaultChecked
              />
              {t.auth.remember}
            </label>
            <Link
              href="#"
              className="font-medium text-peach-700 hover:text-peach-600"
            >
              {t.auth.forgot}
            </Link>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {t.auth.submit}
            <ArrowRight className="size-4" />
          </Button>

          <p className="pt-2 text-center text-xs text-ink-50">
            {t.auth.noAccount}{" "}
            <Link
              href="/register"
              className="font-semibold text-peach-700 hover:text-peach-600"
            >
              {t.auth.signUp}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
