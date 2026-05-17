"use client";

import { useCallback, useEffect, useState } from "react";
import { Code2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  MOCK_PAYMENT_STORAGE_KEY,
  readMockPaymentGatewayEnabled,
} from "@/lib/dev/mock-payment-gateway";

export default function DeveloperPage() {
  const { t } = useLocale();
  const [mockPayments, setMockPayments] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMockPayments(readMockPaymentGatewayEnabled());
    setMounted(true);
  }, []);

  const persist = useCallback((next: boolean) => {
    setMockPayments(next);
    try {
      if (next) {
        window.localStorage.setItem(MOCK_PAYMENT_STORAGE_KEY, "true");
      } else {
        window.localStorage.removeItem(MOCK_PAYMENT_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
    try {
      window.dispatchEvent(new Event("solebook-mock-payment-changed"));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <div className="rounded-xl bg-peach-100 p-2 text-peach-600">
          <Code2 className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-ink-300">{t.developer.title}</h2>
          <p className="text-sm text-ink-50">{t.developer.sub}</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.developer.mockTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-snow-300 bg-snow-50/80 px-4 py-3">
            <p className="text-sm text-ink-200">{t.developer.mockDesc}</p>
            <Switch
              checked={mounted && mockPayments}
              onCheckedChange={persist}
              disabled={!mounted}
              aria-label={mockPayments ? t.developer.mockEnabled : t.developer.mockDisabled}
            />
          </div>
          <p className="text-xs text-ink-50">{t.developer.prodHint}</p>
        </CardContent>
      </Card>
    </div>
  );
}
