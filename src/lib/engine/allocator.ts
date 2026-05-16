export interface AllocationInput {
  incomingAmount: number;
  businessType: string;
  obligationsDueIn30Days: number;
  reserveHealth: number; // 0-100 percentage of target
  currentBuckets: {
    operations: number;
    obligations: number;
    profit_reserve: number;
    owner_salary: number;
    growth: number;
  };
  targetPercentages: {
    operations: number;
    obligations: number;
    profit_reserve: number;
    owner_salary: number;
    growth: number;
  };
  ownerSalaryGoal: number;
  ownerWithdrawnThisMonth: number;
}

export interface AllocationResult {
  operations: number;
  obligations: number;
  profit_reserve: number;
  owner_salary: number;
  growth: number;
  explanation: string;
  engineVersion: string;
}

const BUSINESS_TYPE_WEIGHTS: Record<string, Record<string, number>> = {
  retail: { operations: 1.2, obligations: 1.0, profit_reserve: 0.8, owner_salary: 1.0, growth: 0.8 },
  restaurant: { operations: 1.1, obligations: 1.1, profit_reserve: 0.9, owner_salary: 1.0, growth: 0.8 },
  services: { operations: 0.9, obligations: 1.0, profit_reserve: 1.0, owner_salary: 1.2, growth: 1.0 },
  manufacturing: { operations: 1.3, obligations: 1.0, profit_reserve: 1.0, owner_salary: 0.8, growth: 0.9 },
  wholesale: { operations: 1.2, obligations: 1.1, profit_reserve: 0.8, owner_salary: 0.9, growth: 1.0 },
  other: { operations: 1.0, obligations: 1.0, profit_reserve: 1.0, owner_salary: 1.0, growth: 1.0 },
};

export function computeAllocation(input: AllocationInput): AllocationResult {
  const {
    incomingAmount,
    businessType,
    obligationsDueIn30Days,
    reserveHealth,
    targetPercentages,
    ownerSalaryGoal,
    ownerWithdrawnThisMonth,
  } = input;

  const weights = BUSINESS_TYPE_WEIGHTS[businessType] || BUSINESS_TYPE_WEIGHTS.other;
  const explanations: string[] = [];

  // Calculate urgency factors
  const obligationUrgency = obligationsDueIn30Days > incomingAmount * 0.5 ? 1.3 : 1.0;
  const reserveUrgency = reserveHealth < 50 ? 1.2 : reserveHealth < 80 ? 1.1 : 1.0;
  const salaryNeeded = Math.max(0, ownerSalaryGoal - ownerWithdrawnThisMonth);
  const salaryUrgency = salaryNeeded > 0 ? 1.1 : 0.8;

  // Base allocation from targets
  let alloc = {
    operations: (targetPercentages.operations / 100) * incomingAmount * weights.operations,
    obligations: (targetPercentages.obligations / 100) * incomingAmount * weights.obligations * obligationUrgency,
    profit_reserve: (targetPercentages.profit_reserve / 100) * incomingAmount * weights.profit_reserve * reserveUrgency,
    owner_salary: (targetPercentages.owner_salary / 100) * incomingAmount * weights.owner_salary * salaryUrgency,
    growth: (targetPercentages.growth / 100) * incomingAmount * weights.growth,
  };

  // Normalize to total
  const rawTotal = Object.values(alloc).reduce((s, v) => s + v, 0);
  const scale = incomingAmount / rawTotal;
  alloc = {
    operations: Math.round(alloc.operations * scale),
    obligations: Math.round(alloc.obligations * scale),
    profit_reserve: Math.round(alloc.profit_reserve * scale),
    owner_salary: Math.round(alloc.owner_salary * scale),
    growth: Math.round(alloc.growth * scale),
  };

  // Adjust rounding difference
  const total = Object.values(alloc).reduce((s, v) => s + v, 0);
  const diff = incomingAmount - total;
  alloc.operations += diff;

  // Build explanation
  if (obligationUrgency > 1) explanations.push('Obligations prioritized due to upcoming payments.');
  if (reserveUrgency > 1) explanations.push('Extra allocated to reserve (below target).');
  if (salaryUrgency < 1) explanations.push('Owner salary reduced (already met this month).');

  return {
    ...alloc,
    explanation: explanations.length > 0
      ? explanations.join(' ')
      : 'Standard allocation based on business profile.',
    engineVersion: 'v1',
  };
}
