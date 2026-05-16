"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/components/providers/LocaleProvider";

interface QRPaymentViewProps {
  amount: number;
  planName: string;
  onSuccess: (ref: string) => void;
  onFailure: (error: string) => void;
  onCancel: () => void;
}

type QRState = "loading" | "ready" | "polling" | "success" | "failed";

export function QRPaymentView({
  amount,
  planName,
  onSuccess,
  onFailure,
  onCancel,
}: QRPaymentViewProps) {
  const { t } = useLocale();
  const [state, setState] = useState<QRState>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [refNo, setRefNo] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function generateQR() {
      try {
        const res = await fetch("/api/payments/qr/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount.toFixed(2),
            purposeOfTransaction: `SoleBook ${planName} Subscription`,
          }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (data.ok && data.qrCode) {
          setQrCode(data.qrCode);
          setRefNo(data.requestRefNo ?? data.transactionReference ?? "");
          setState("ready");
          startTimer();
        } else {
          setError(data.error ?? "Failed to generate QR code");
          setState("failed");
        }
      } catch {
        if (!cancelled) {
          setError("Network error generating QR code");
          setState("failed");
        }
      }
    }

    generateQR();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startTimer() {
    setTimeLeft(300);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (pollRef.current) clearInterval(pollRef.current);
          setState("failed");
          setError("QR code expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function startPolling() {
    setState("polling");
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?ref=${encodeURIComponent(refNo)}`);
        const data = await res.json();
        if (data.ok && data.status === "success") {
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          setState("success");
          onSuccess(refNo);
        }
      } catch {
        // keep polling on network errors
      }
    }, 5000);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="size-10 text-peach-500 animate-spin" />
        <p className="text-sm text-ink-100">{t.subscription.processing}</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <CheckCircle2 className="size-14 text-emerald-500" />
        <p className="text-lg font-semibold text-ink-300">{t.subscription.success}</p>
        <p className="text-sm text-ink-100">{t.subscription.successDesc}</p>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <XCircle className="size-14 text-red-500" />
        <p className="text-lg font-semibold text-ink-300">{t.subscription.failed}</p>
        <p className="text-sm text-ink-100 text-center">{error || t.subscription.failedDesc}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button onClick={() => onFailure(error)}>
            {t.subscription.tryAgain}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="rounded-2xl border-2 border-snow-300 bg-white p-4">
        {qrCode ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrCode}
            alt="Payment QR Code"
            className="size-56"
          />
        ) : (
          <div className="flex size-56 items-center justify-center">
            <QrCode className="size-24 text-ink-50" />
          </div>
        )}
      </div>

      <p className="text-sm font-medium text-ink-200">{t.subscription.scanQR}</p>

      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <p className="text-xs text-ink-50">{t.subscription.amount}</p>
          <p className="font-semibold text-ink-300">Rs. {amount.toLocaleString()}</p>
        </div>
        {refNo && (
          <div className="text-center">
            <p className="text-xs text-ink-50">{t.subscription.reference}</p>
            <p className="font-mono text-xs text-ink-200">{refNo}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-full bg-snow-100 px-4 py-2">
        <span className="text-xs text-ink-50">
          {t.subscription.qrExpiry.replace("{{minutes}}", String(minutes))}
        </span>
        <span className="font-mono text-sm font-semibold text-ink-300">
          {minutes}:{String(seconds).padStart(2, "0")}
        </span>
      </div>

      {state === "polling" ? (
        <div className="flex items-center gap-2 text-sm text-ink-100">
          <Loader2 className="size-4 animate-spin" />
          {t.subscription.waitingPayment}
        </div>
      ) : (
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button onClick={startPolling}>
            {t.subscription.waitingPayment.replace("…", "")}
          </Button>
        </div>
      )}
    </div>
  );
}
