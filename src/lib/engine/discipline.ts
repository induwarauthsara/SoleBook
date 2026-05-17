export interface DisciplineInput {
  obligationsPaidOnTime: number;
  obligationsTotal: number;
  reserveCurrentPct: number;
  reserveTargetPct: number;
  ownerSalaryGoal: number;
  ownerTotalWithdrawn: number;
  unplannedWithdrawals: number;
  inflowLast30Days: number;
  outflowLast30Days: number;
  inflowPrior30Days: number;
  outflowPrior30Days: number;
}

export interface DisciplineResult {
  score: number;
  components: {
    payment_timeliness: number;
    reserve_consistency: number;
    owner_salary_stability: number;
    leakage_penalty: number;
    cash_flow_health: number;
  };
  band: 'excellent' | 'good' | 'fair' | 'poor';
}

export function computeDisciplineScore(input: DisciplineInput): DisciplineResult {
  const {
    obligationsPaidOnTime,
    obligationsTotal,
    reserveCurrentPct,
    reserveTargetPct,
    ownerSalaryGoal,
    ownerTotalWithdrawn,
    unplannedWithdrawals,
    inflowLast30Days,
    outflowLast30Days,
    inflowPrior30Days,
    outflowPrior30Days,
  } = input;

  // Payment timeliness (30%)
  const paymentRatio = obligationsTotal > 0 ? obligationsPaidOnTime / obligationsTotal : 1;
  const paymentTimeliness = Math.round(paymentRatio * 100);

  // Reserve consistency (25%)
  const reserveRatio = reserveTargetPct > 0 ? Math.min(reserveCurrentPct / reserveTargetPct, 1) : 1;
  const reserveConsistency = Math.round(reserveRatio * 100);

  // Owner salary stability (20%)
  const salaryAdherence = ownerSalaryGoal > 0
    ? Math.max(0, 100 - Math.abs(ownerTotalWithdrawn - ownerSalaryGoal) / ownerSalaryGoal * 100)
    : 100;
  const ownerSalaryStability = Math.round(Math.min(salaryAdherence, 100));

  // Personal leakage penalty (-15 max)
  const leakagePenalty = Math.min(unplannedWithdrawals * 5, 15);

  // Cash flow health (10%)
  const netFlowCurrent = inflowLast30Days - outflowLast30Days;
  const netFlowPrior = inflowPrior30Days - outflowPrior30Days;
  let cashFlowHealth = 50;
  if (netFlowCurrent > 0 && netFlowPrior > 0) cashFlowHealth = 100;
  else if (netFlowCurrent > 0) cashFlowHealth = 75;
  else if (netFlowCurrent > netFlowPrior) cashFlowHealth = 40;
  else cashFlowHealth = 20;

  // Weighted score
  const score = Math.max(0, Math.min(100, Math.round(
    paymentTimeliness * 0.30 +
    reserveConsistency * 0.25 +
    ownerSalaryStability * 0.20 +
    cashFlowHealth * 0.10 -
    leakagePenalty
  )));

  const band = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';

  return {
    score,
    components: {
      payment_timeliness: paymentTimeliness,
      reserve_consistency: reserveConsistency,
      owner_salary_stability: ownerSalaryStability,
      leakage_penalty: -leakagePenalty,
      cash_flow_health: cashFlowHealth,
    },
    band,
  };
}
