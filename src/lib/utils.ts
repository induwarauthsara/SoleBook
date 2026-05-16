import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "LKR"): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rs. ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `Rs. ${(amount / 1_000).toFixed(0)}K`;
  }
  return `Rs. ${amount.toFixed(0)}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function getDaysUntil(date: Date | string): number {
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getUrgencyColor(daysUntil: number): string {
  if (daysUntil <= 3) return "text-danger";
  if (daysUntil <= 7) return "text-warning";
  return "text-success";
}

export function getUrgencyBg(daysUntil: number): string {
  if (daysUntil <= 3) return "bg-danger/10 border-danger/20";
  if (daysUntil <= 7) return "bg-warning/10 border-warning/20";
  return "bg-success/10 border-success/20";
}

export function getPriorityColor(priority: "HIGH" | "MEDIUM" | "LOW"): string {
  switch (priority) {
    case "HIGH":
      return "text-danger";
    case "MEDIUM":
      return "text-warning";
    case "LOW":
      return "text-success";
  }
}

export function getPriorityBg(priority: "HIGH" | "MEDIUM" | "LOW"): string {
  switch (priority) {
    case "HIGH":
      return "bg-danger/10 border-danger/30 text-danger";
    case "MEDIUM":
      return "bg-warning/10 border-warning/30 text-warning";
    case "LOW":
      return "bg-success/10 border-success/30 text-success";
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  if (score >= 40) return "#F27344";
  return "#EF4444";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "At Risk";
}
