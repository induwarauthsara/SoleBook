import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "LKR") {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortCurrency(amount: number) {
  const sign = amount < 0 ? "-" : "";
  const value = Math.abs(amount);
  if (value >= 1_000_000) return `${sign}Rs. ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${sign}Rs. ${(value / 1_000).toFixed(0)}K`;
  return `${sign}Rs. ${value.toFixed(0)}`;
}

export function formatPercent(value: number, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

export function getDaysUntil(date: Date | string) {
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getUrgencyTone(daysUntil: number) {
  if (daysUntil <= 3) return "danger" as const;
  if (daysUntil <= 7) return "warning" as const;
  return "success" as const;
}

export function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "At Risk";
}

export function getScoreColor(score: number) {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  if (score >= 40) return "#F27344";
  return "#EF4444";
}
