"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Crown,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  PaymentMethodPicker,
  type PaymentMethodChoice,
} from "@/components/app/PaymentMethodPicker";
import { QRPaymentView } from "@/components/app/QRPaymentView";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SubscriptionPlan } from "@/types/app";
import { messageFromApiBody, readJsonSafe } from "@/lib/api-error";
import { mockPaymentGatewayHeaders } from "@/lib/dev/mock-payment-gateway";

type BillingCycle = "monthly" | "annual";

type FlowStep = "select" | "method" | "processing" | "qr" | "success" | "failed";

export default function SubscriptionPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  // Payment flow state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodChoice | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>("select");
  const [txnRef, setTxnRef] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/payments/plans")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setPlans(data.plans);
      })
      .catch(() => toast.error("Failed to load plans"))
      .finally(() => setLoading(false));
  }, []);

  const priceForPlan = useCallback(
    (plan: SubscriptionPlan) =>
      cycle === "monthly" ? plan.monthlyPrice : plan.annualPrice,
    [cycle],
  );

  function openPaymentDialog(plan: SubscriptionPlan) {
    setSelectedPlan(plan);
    setPaymentMethod(null);
    setFlowStep("method");
    setTxnRef("");
    setErrorMsg("");
    setDialogOpen(true);
  }

  async function handleProceedPayment() {
    if (!selectedPlan || !paymentMethod) return;

    const amount = priceForPlan(selectedPlan);

    if (paymentMethod === "qr") {
      setFlowStep("qr");
      return;
    }

    // Bank transfer flow
    setFlowStep("processing");
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...mockPaymentGatewayHeaders(),
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingCycle: cycle,
          amount,
          method: paymentMethod,
        }),
      });
      const raw = await readJsonSafe(res);
      const data =
        raw && typeof raw === "object"
          ? (raw as { ok?: boolean; transactionReference?: string; error?: string })
          : null;

      if (res.ok && data?.ok) {
        setTxnRef(data.transactionReference ?? "");
        setFlowStep("success");
      } else {
        setErrorMsg(
          messageFromApiBody(
            raw,
            !res.ok ? `Request failed (${res.status}).` : "Payment failed",
          ),
        );
        setFlowStep("failed");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setFlowStep("failed");
    }
  }

  function handleClose() {
    setDialogOpen(false);
    setFlowStep("select");
  }

  const annualSavingPct = 29;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-ink-300">{t.subscription.title}</h2>
        <p className="text-sm text-ink-50">{t.subscription.sub}</p>
      </header>

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setCycle("monthly")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            cycle === "monthly"
              ? "bg-peach-500 text-white"
              : "bg-snow-200 text-ink-100 hover:bg-snow-300",
          )}
        >
          {t.subscription.monthlyToggle}
        </button>
        <button
          type="button"
          onClick={() => setCycle("annual")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            cycle === "annual"
              ? "bg-peach-500 text-white"
              : "bg-snow-200 text-ink-100 hover:bg-snow-300",
          )}
        >
          {t.subscription.annualToggle}
          <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            {t.subscription.savePercent.replace("{{pct}}", String(annualSavingPct))}
          </span>
        </button>
      </div>

      {/* Plans grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 text-peach-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = priceForPlan(plan);
            return (
              <Card
                key={plan.id}
                hover
                className={cn(
                  "relative flex flex-col",
                  plan.recommended && "ring-2 ring-peach-500",
                )}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-peach-500 text-white border-0 gap-1">
                      <Crown className="size-3" />
                      {t.subscription.recommended}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pt-6">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-ink-300">
                      Rs. {price.toLocaleString()}
                    </span>
                    <span className="text-sm text-ink-50">
                      {cycle === "monthly"
                        ? t.subscription.perMonth
                        : t.subscription.perYear}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col">
                  <ul className="flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-ink-200">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="mt-5 w-full"
                    variant={plan.recommended ? "default" : "outline"}
                    onClick={() => openPaymentDialog(plan)}
                  >
                    {t.subscription.selectPlan}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          {flowStep === "method" && selectedPlan && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t.subscription.payNow} — {selectedPlan.name}
                </DialogTitle>
                <DialogDescription>
                  Rs. {priceForPlan(selectedPlan).toLocaleString()}{" "}
                  {cycle === "monthly"
                    ? t.subscription.perMonth
                    : t.subscription.perYear}
                </DialogDescription>
              </DialogHeader>

              <PaymentMethodPicker
                selected={paymentMethod}
                onSelect={setPaymentMethod}
              />

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  {t.common.cancel}
                </Button>
                <Button
                  disabled={!paymentMethod}
                  onClick={handleProceedPayment}
                >
                  {t.subscription.payNow}
                </Button>
              </div>
            </>
          )}

          {flowStep === "processing" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="size-10 text-peach-500 animate-spin" />
              <p className="text-sm text-ink-100">{t.subscription.processing}</p>
            </div>
          )}

          {flowStep === "qr" && selectedPlan && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t.subscription.qrPayment} — {selectedPlan.name}
                </DialogTitle>
              </DialogHeader>
              <QRPaymentView
                amount={priceForPlan(selectedPlan)}
                planName={selectedPlan.name}
                onSuccess={(ref) => {
                  setTxnRef(ref);
                  setFlowStep("success");
                }}
                onFailure={(err) => {
                  setErrorMsg(err);
                  setFlowStep("failed");
                }}
                onCancel={handleClose}
              />
            </>
          )}

          {flowStep === "success" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="size-14 text-emerald-500" />
              <p className="text-lg font-semibold text-ink-300">
                {t.subscription.success}
              </p>
              <p className="text-sm text-ink-100 text-center">
                {t.subscription.successDesc}
              </p>
              {txnRef && (
                <p className="text-xs text-ink-50 font-mono">{txnRef}</p>
              )}
              <Button
                className="mt-2"
                onClick={() => {
                  handleClose();
                  router.push("/dashboard");
                }}
              >
                {t.subscription.goToDashboard}
              </Button>
            </div>
          )}

          {flowStep === "failed" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <XCircle className="size-14 text-red-500" />
              <p className="text-lg font-semibold text-ink-300">
                {t.subscription.failed}
              </p>
              <p className="text-sm text-ink-100 text-center">
                {errorMsg || t.subscription.failedDesc}
              </p>
              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={handleClose}>
                  {t.common.cancel}
                </Button>
                <Button onClick={() => setFlowStep("method")}>
                  {t.subscription.tryAgain}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
