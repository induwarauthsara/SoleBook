import type {
  BusinessType,
  AllocationSplit,
  BucketName,
  Obligation,
} from "@/types";

interface AllocationInput {
  amount: number;
  businessType: BusinessType;
  upcomingObligations: Obligation[];
  currentReserveBalance: number;
  monthlyRevenueTrend: "growing" | "stable" | "declining";
  ownerSalaryGoal: number;
}

interface AllocationResult {
  splits: AllocationSplit[];
  reasoning: string;
  riskLevel: "safe" | "warning" | "caution";
}

const BASE_PROFILES: Record<
  BusinessType,
  Record<BucketName, number>
> = {
  retail: {
    operations: 50,
    obligations: 25,
    reserve: 12,
    owner_salary: 10,
    growth: 3,
  },
  restaurant: {
    operations: 55,
    obligations: 22,
    reserve: 10,
    owner_salary: 10,
    growth: 3,
  },
  services: {
    operations: 40,
    obligations: 28,
    reserve: 15,
    owner_salary: 12,
    growth: 5,
  },
  wholesale: {
    operations: 60,
    obligations: 20,
    reserve: 10,
    owner_salary: 8,
    growth: 2,
  },
  online: {
    operations: 45,
    obligations: 22,
    reserve: 15,
    owner_salary: 12,
    growth: 6,
  },
  freelancer: {
    operations: 30,
    obligations: 30,
    reserve: 20,
    owner_salary: 15,
    growth: 5,
  },
};

export function computeAllocation(
  input: AllocationInput
): AllocationResult {
  const {
    amount,
    businessType,
    upcomingObligations,
    currentReserveBalance,
    monthlyRevenueTrend,
    ownerSalaryGoal,
  } = input;

  const base = { ...BASE_PROFILES[businessType] };

  const totalUpcomingObligations = upcomingObligations
    .filter((o) => o.status === "pending")
    .reduce((sum, o) => sum + o.amount, 0);

  const obligationCoverage = currentReserveBalance / totalUpcomingObligations;
  let riskLevel: "safe" | "warning" | "caution" = "safe";
  let reasoning = "";

  if (obligationCoverage < 0.5) {
    base.obligations = Math.min(base.obligations + 10, 40);
    base.operations = Math.max(base.operations - 7, 30);
    base.reserve = Math.max(base.reserve - 3, 5);
    riskLevel = "warning";
    reasoning =
      "Obligation coverage is low. Increasing allocation to secure upcoming payments.";
  } else if (obligationCoverage < 0.8) {
    base.obligations = Math.min(base.obligations + 5, 35);
    base.operations = Math.max(base.operations - 5, 35);
    riskLevel = "caution";
    reasoning =
      "Upcoming obligations need more coverage. Slightly boosting obligations bucket.";
  }

  if (monthlyRevenueTrend === "declining") {
    base.reserve = Math.min(base.reserve + 5, 25);
    base.growth = Math.max(base.growth - 3, 1);
    reasoning +=
      " Revenue declining — building reserve buffer for stability.";
  } else if (monthlyRevenueTrend === "growing" && riskLevel === "safe") {
    base.growth = Math.min(base.growth + 2, 10);
    base.owner_salary = Math.min(base.owner_salary + 1, 15);
    reasoning +=
      " Strong revenue — boosting growth investment and owner salary.";
  }

  const total = Object.values(base).reduce((s, v) => s + v, 0);
  const normFactor = 100 / total;
  const normalized = Object.fromEntries(
    Object.entries(base).map(([k, v]) => [k, v * normFactor])
  ) as Record<BucketName, number>;

  const splits: AllocationSplit[] = (
    Object.entries(normalized) as [BucketName, number][]
  ).map(([bucket, pct]) => ({
    bucket,
    pct: Math.round(pct * 10) / 10,
    amount: Math.round((pct / 100) * amount),
  }));

  if (!reasoning) {
    reasoning =
      "Balanced allocation based on your business type and current cash health.";
  }

  return { splits, reasoning: reasoning.trim(), riskLevel };
}

export function computeDisciplineScore(params: {
  onTimePayments: number;
  reserveTrend: number;
  ownerWithdrawn: number;
  ownerSalaryGoal: number;
  latePayments: number;
}): number {
  const { onTimePayments, reserveTrend, ownerWithdrawn, ownerSalaryGoal, latePayments } = params;

  const paymentScore = Math.min(onTimePayments * 10, 30);
  const reserveScore = Math.min(reserveTrend * 5, 25);
  const salaryRatio = Math.min(ownerWithdrawn / ownerSalaryGoal, 1.5);
  const salaryScore = salaryRatio <= 1.0 ? 20 : Math.max(20 - (salaryRatio - 1) * 40, 0);
  const penaltyScore = Math.max(20 - latePayments * 5, 0);
  const baseScore = 5;

  return Math.round(
    Math.min(paymentScore + reserveScore + salaryScore + penaltyScore + baseScore, 100)
  );
}
