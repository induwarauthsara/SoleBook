"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { messageFromApiBody, readJsonSafe } from "@/lib/api-error";
import {
  OBLIGATION_RECURRENCE_CODES,
  type ObligationRecurrenceCode,
} from "@/lib/obligations-recurrence";

const OBLIGATION_CATEGORY_KEYS = [
  "rent",
  "payroll",
  "utilities",
  "loan",
  "supplier",
  "tax",
  "subscription",
  "other",
] as const;

export type ObligationCategoryKey = (typeof OBLIGATION_CATEGORY_KEYS)[number];

interface AddObligationDialogProps {
  children: React.ReactNode;
  onSuccess: () => void | Promise<void>;
}

export function AddObligationDialog({
  children,
  onSuccess,
}: AddObligationDialogProps) {
  const { session } = useAuth();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] =
    useState<ObligationCategoryKey>("utilities");
  const [counterparty, setCounterparty] = useState("");
  const [dueDate, setDueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [priority, setPriority] = useState<"high" | "medium" | "low">(
    "medium",
  );
  const [notes, setNotes] = useState("");
  const [recurrence, setRecurrence] = useState<
    "" | ObligationRecurrenceCode
  >("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!session?.access_token) {
      toast.error("You must be signed in");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        category,
        amount_lkr: parsed,
        due_date: dueDate,
        priority,
      };
      if (counterparty.trim()) body.counterparty_alias = counterparty.trim();
      if (notes.trim()) body.notes = notes.trim();
      if (recurrence) body.recurrence = recurrence;

      const res = await fetch("/api/obligations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await readJsonSafe(res);
      if (!res.ok) {
        toast.error(
          messageFromApiBody(
            data,
            `Could not add obligation (${res.status})`,
          ),
        );
        return;
      }

      toast.success(t.obligations.addModal.success);
      setOpen(false);
      setAmount("");
      setCounterparty("");
      setNotes("");
      setRecurrence("");
      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const ta = t.obligations.addModal;
  const tc = t.obligations.categories;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ta.title}</DialogTitle>
          <DialogDescription>{t.obligations.sub}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label={ta.amount}>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={0}
              step="0.01"
            />
          </Field>
          <Field label={ta.dueDate}>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </Field>
          <Field label={ta.category}>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as ObligationCategoryKey)
              }
              className="flex h-10 w-full rounded-lg border border-snow-300 bg-white px-3 text-sm text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-500/50 focus-visible:border-peach-500"
            >
              {OBLIGATION_CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {tc[key]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ta.recurrenceLabel}>
            <select
              value={recurrence}
              onChange={(e) =>
                setRecurrence(
                  e.target.value as "" | ObligationRecurrenceCode,
                )
              }
              className="flex h-10 w-full rounded-lg border border-snow-300 bg-white px-3 text-sm text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-500/50 focus-visible:border-peach-500"
            >
              <option value="">{ta.recurrence.none}</option>
              {OBLIGATION_RECURRENCE_CODES.map((code) => (
                <option key={code} value={code}>
                  {ta.recurrence[code]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ta.counterparty}>
            <Input
              placeholder=""
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
            />
          </Field>
          <Field label={ta.priorityLabel}>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "high" | "medium" | "low")
              }
              className="flex h-10 w-full rounded-lg border border-snow-300 bg-white px-3 text-sm text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-500/50 focus-visible:border-peach-500"
            >
              <option value="high">
                {t.obligations.priority.HIGH}
              </option>
              <option value="medium">
                {t.obligations.priority.MEDIUM}
              </option>
              <option value="low">{t.obligations.priority.LOW}</option>
            </select>
          </Field>
          <Field label={ta.notes}>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={submitting}>
              {ta.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-100">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
