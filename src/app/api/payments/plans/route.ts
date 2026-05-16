import { NextResponse } from "next/server";
import type { SubscriptionPlan } from "@/types/app";

export const runtime = "nodejs";

const PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 1500,
    annualPrice: 15000,
    features: [
      "1 bank account",
      "Smart buckets",
      "Basic AI insights",
      "Obligation tracking",
      "Owner salary discipline",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 3500,
    annualPrice: 35000,
    features: [
      "Up to 3 bank accounts",
      "Smart buckets",
      "Advanced AI advisor",
      "Cash flow forecasting",
      "Obligation tracking",
      "Owner salary discipline",
      "ERP sync (Xero, QuickBooks)",
      "Loan readiness score",
    ],
    recommended: true,
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: 7500,
    annualPrice: 75000,
    features: [
      "Unlimited bank accounts",
      "Smart buckets",
      "Priority AI advisor",
      "Advanced cash flow forecasting",
      "Obligation tracking",
      "Owner salary discipline",
      "Full ERP integration",
      "Loan readiness score",
      "Multi-user access",
      "Dedicated support",
    ],
  },
];

export async function GET() {
  return NextResponse.json({ ok: true, plans: PLANS });
}
