"use client";

import { Landmark, QrCode, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/LocaleProvider";

export type PaymentMethodChoice = "bank_transfer" | "qr" | "justpay";

interface PaymentMethodPickerProps {
  selected: PaymentMethodChoice | null;
  onSelect: (method: PaymentMethodChoice) => void;
}

const METHODS: {
  id: PaymentMethodChoice;
  icon: typeof Landmark;
  labelKey: "bankTransfer" | "qrPayment" | "justpay";
  descKey: "bankTransferDesc" | "qrPaymentDesc" | "justpayDesc";
}[] = [
  { id: "bank_transfer", icon: Landmark, labelKey: "bankTransfer", descKey: "bankTransferDesc" },
  { id: "qr", icon: QrCode, labelKey: "qrPayment", descKey: "qrPaymentDesc" },
  { id: "justpay", icon: Banknote, labelKey: "justpay", descKey: "justpayDesc" },
];

export function PaymentMethodPicker({ selected, onSelect }: PaymentMethodPickerProps) {
  const { t } = useLocale();

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink-200">{t.subscription.chooseMethod}</p>
      <div className="grid gap-3">
        {METHODS.map((m) => {
          const Icon = m.icon;
          const active = selected === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={cn(
                "flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                active
                  ? "border-peach-500 bg-peach-50"
                  : "border-snow-300 bg-white hover:border-peach-300 hover:bg-peach-50/50",
              )}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  active ? "bg-peach-500 text-white" : "bg-snow-200 text-ink-100",
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-300">
                  {t.subscription[m.labelKey]}
                </p>
                <p className="text-xs text-ink-50">
                  {t.subscription[m.descKey]}
                </p>
              </div>
              <div
                className={cn(
                  "size-5 rounded-full border-2 transition-colors",
                  active
                    ? "border-peach-500 bg-peach-500"
                    : "border-snow-300",
                )}
              >
                {active && (
                  <svg viewBox="0 0 20 20" className="size-full text-white">
                    <path
                      fill="currentColor"
                      d="M8.5 13.3 5.2 10l-1 1L8.5 15.3 16.8 7l-1-1z"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
