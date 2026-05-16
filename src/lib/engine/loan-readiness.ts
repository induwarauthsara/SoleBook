export interface LoanReadinessInput {
  monthlyRevenues: number[]; // Last 6 months
  reserveBalanceHistory: number[]; // Last 6 months end-of-month
  reserveTarget: number;
  obligationsFulfilledOnTime: number;
  obligationsTotal: number;
  netCashFlow3Months: number[];
  ownerSalaryAdherence: number; // 0-100
  monthlyIncome: number;
  monthlyObligations: number;
}

export interface LoanReadinessResult {
  score: number;
  components: {
    revenue_stability: number;
    reserve_discipline: number;
    payment_history: number;
    cash_flow_trend: number;
    owner_discipline: number;
    debt_coverage: number;
  };
  band: 'strong' | 'moderate' | 'developing' | 'weak';
  recommendations: string[];
}

function coefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function computeLoanReadiness(input: LoanReadinessInput): LoanReadinessResult {
  const recommendations: string[] = [];

  // Revenue stability (lower CV = more stable = higher score)
  const cv = coefficientOfVariation(input.monthlyRevenues);
  const revenueStability = Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)));
  if (revenueStability < 60) recommendations.push('Stabilize monthly revenue streams to improve lending profile.');

  // Reserve discipline
  const monthsAboveTarget = input.reserveBalanceHistory.filter(b => b >= input.reserveTarget).length;
  const reserveDiscipline = Math.round((monthsAboveTarget / Math.max(input.reserveBalanceHistory.length, 1)) * 100);
  if (reserveDiscipline < 50) recommendations.push('Maintain profit reserve above target for at least 3 consecutive months.');

  // Payment history
  const paymentHistory = input.obligationsTotal > 0
    ? Math.round((input.obligationsFulfilledOnTime / input.obligationsTotal) * 100)
    : 100;
  if (paymentHistory < 80) recommendations.push('Improve on-time payment rate to demonstrate reliability.');

  // Cash flow trend (positive trend = good)
  let cashFlowTrend = 50;
  if (input.netCashFlow3Months.length >= 3) {
    const improving = input.netCashFlow3Months[2] > input.netCashFlow3Months[0];
    const allPositive = input.netCashFlow3Months.every(v => v > 0);
    if (allPositive && improving) cashFlowTrend = 100;
    else if (allPositive) cashFlowTrend = 80;
    else if (improving) cashFlowTrend = 60;
    else cashFlowTrend = 30;
  }
  if (cashFlowTrend < 60) recommendations.push('Achieve consistent positive net cash flow over 3+ months.');

  // Owner discipline
  const ownerDiscipline = input.ownerSalaryAdherence;
  if (ownerDiscipline < 70) recommendations.push('Follow structured salary plan to show financial discipline.');

  // Debt service coverage ratio
  const dscr = input.monthlyObligations > 0
    ? input.monthlyIncome / input.monthlyObligations
    : 5;
  const debtCoverage = Math.round(Math.min(100, (dscr / 2) * 100));
  if (debtCoverage < 60) recommendations.push('Reduce obligations or increase income to improve debt coverage ratio.');

  // Weighted score
  const score = Math.round(
    revenueStability * 0.20 +
    reserveDiscipline * 0.15 +
    paymentHistory * 0.25 +
    cashFlowTrend * 0.15 +
    ownerDiscipline * 0.10 +
    debtCoverage * 0.15
  );

  const band = score >= 75 ? 'strong' : score >= 55 ? 'moderate' : score >= 35 ? 'developing' : 'weak';

  return {
    score,
    components: {
      revenue_stability: revenueStability,
      reserve_discipline: reserveDiscipline,
      payment_history: paymentHistory,
      cash_flow_trend: cashFlowTrend,
      owner_discipline: ownerDiscipline,
      debt_coverage: debtCoverage,
    },
    band,
    recommendations,
  };
}
