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
import { useAppData } from "@/components/providers/AppDataProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

const CATEGORIES = [
  "Inventory",
  "Salary",
  "Utilities",
  "Rent",
  "Transport",
  "Supplier",
  "Marketing",
  "Other",
];

interface AddExpenseDialogProps {
  children: React.ReactNode;
}

export function AddExpenseDialog({ children }: AddExpenseDialogProps) {
  const { addTransaction, business } = useAppData();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    addTransaction({
      id: `t-${Date.now()}`,
      businessId: business.id,
      amount: parsed,
      type: "expense",
      category,
      description: description || category,
      date: new Date(date).toISOString(),
      source: "manual",
    });
    toast.success("Expense added");
    setOpen(false);
    setAmount("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.history.addModal.title}</DialogTitle>
          <DialogDescription>{t.history.sub}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label={t.history.addModal.amount}>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
          <Field label={t.history.addModal.category}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-snow-300 bg-white px-3 text-sm text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-500/50 focus-visible:border-peach-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.history.addModal.description}>
            <Input
              placeholder="e.g. Beverages restock"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label={t.history.addModal.date}>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit">{t.history.addModal.save}</Button>
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
