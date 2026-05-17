import type { RunwayResult } from '@/lib/engine/runway';

export type DeterministicInsightRow = {
  id: string;
  org_id: string;
  category:
    | 'cash_risk'
    | 'discipline'
    | 'leakage'
    | 'supplier_risk'
    | 'reserve_health'
    | 'forecast'
    | 'recommendation'
    | 'fraud_signal'
    | 'other';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  generated_at: string;
  generated_by: 'rules';
};

function lkr(n: number): string {
  return `LKR ${Math.round(n).toLocaleString('en-LK')}`;
}

/** Rule-based insights when the DB has no AI rows yet — reacts to live dashboard inputs. */
export function buildDeterministicInsights(input: {
  orgId: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  currentBalance: number;
  runway: RunwayResult;
  pendingObligationsCount: number;
  pendingObligationsTotal: number;
  reserveBalance: number;
  reserveTargetMinimum: number;
  ownerSalaryGoal: number;
  ownerTotalWithdrawn: number;
  unplannedWithdrawalsCount: number;
}): DeterministicInsightRow[] {
  const now = new Date().toISOString();
  const out: DeterministicInsightRow[] = [];

  const {
    orgId,
    monthlyRevenue,
    monthlyExpenses,
    currentBalance,
    runway,
    pendingObligationsCount,
    pendingObligationsTotal,
    reserveBalance,
    reserveTargetMinimum,
    ownerSalaryGoal,
    ownerTotalWithdrawn,
    unplannedWithdrawalsCount,
  } = input;

  if (
    runway.daysUntilZero !== null &&
    runway.riskBand === 'high' &&
    monthlyExpenses > 0
  ) {
    out.push({
      id: `rules-cash-runway-${orgId}`,
      org_id: orgId,
      category: 'cash_risk',
      severity: runway.daysUntilZero <= 7 ? 'critical' : 'warning',
      title: 'Cash runway is tight',
      body: `At recent spending levels, cash in the main accounts may reach critical levels in about ${runway.daysUntilZero} days (balance roughly ${lkr(currentBalance)}). Consider slowing discretionary outflows until inflows catch up.`,
      generated_at: now,
      generated_by: 'rules',
    });
  }

  if (monthlyRevenue > 0 && monthlyExpenses > monthlyRevenue * 1.05) {
    out.push({
      id: `rules-burn-${orgId}`,
      org_id: orgId,
      category: 'forecast',
      severity: 'warning',
      title: 'Spending above recent income',
      body: `Outflows over the last 30 days (${lkr(monthlyExpenses)}) are higher than inflows (${lkr(monthlyRevenue)}). If this continues, reserves and obligation buckets will come under pressure.`,
      generated_at: now,
      generated_by: 'rules',
    });
  }

  if (reserveTargetMinimum > 0 && reserveBalance < reserveTargetMinimum * 0.85) {
    out.push({
      id: `rules-reserve-${orgId}`,
      org_id: orgId,
      category: 'reserve_health',
      severity: reserveBalance < reserveTargetMinimum * 0.5 ? 'warning' : 'info',
      title: 'Profit reserve below target',
      body: `The profit reserve is at ${lkr(reserveBalance)} versus a target floor of ${lkr(reserveTargetMinimum)}. Building it back reduces stress when suppliers or bills bunch up.`,
      generated_at: now,
      generated_by: 'rules',
    });
  }

  if (pendingObligationsCount > 0 && runway.obligationCoverage < 90) {
    out.push({
      id: `rules-oblig-${orgId}`,
      org_id: orgId,
      category: 'supplier_risk',
      severity: runway.obligationCoverage < 60 ? 'critical' : 'warning',
      title: 'Upcoming payments vs available cash',
      body: `You have ${pendingObligationsCount} upcoming obligation(s) totalling about ${lkr(pendingObligationsTotal)}. Coverage over the next 30 days looks near ${runway.obligationCoverage}% — plan pay dates before you commit to extra spend.`,
      generated_at: now,
      generated_by: 'rules',
    });
  }

  if (ownerSalaryGoal > 0 && ownerTotalWithdrawn > ownerSalaryGoal) {
    out.push({
      id: `rules-owner-draw-${orgId}`,
      org_id: orgId,
      category: 'leakage',
      severity: 'warning',
      title: 'Owner withdrawals above salary goal',
      body: `Withdrawals this period (${lkr(ownerTotalWithdrawn)}) are above your stated salary target (${lkr(ownerSalaryGoal)}). That is fine occasionally, but repeated overshoot reduces room for tax, payroll, and suppliers.`,
      generated_at: now,
      generated_by: 'rules',
    });
  }

  if (unplannedWithdrawalsCount > 0) {
    const n = unplannedWithdrawalsCount;
    const bodyLead =
      n === 1
        ? 'There is 1 withdrawal marked outside your salary plan.'
        : `There are ${n} withdrawals marked outside your salary plan.`;
    out.push({
      id: `rules-unplanned-${orgId}`,
      org_id: orgId,
      category: 'discipline',
      severity: 'info',
      title: 'Withdrawals outside the salary plan',
      body: `${bodyLead} Grouping personal draws into the owner salary bucket keeps books clearer and protects discipline scoring.`,
      generated_at: now,
      generated_by: 'rules',
    });
  }

  if (out.length === 0) {
    out.push({
      id: `rules-default-${orgId}`,
      org_id: orgId,
      category: 'recommendation',
      severity: 'info',
      title: 'Keep logging activity',
      body:
        monthlyRevenue + monthlyExpenses > 0
          ? 'Your recent numbers are flowing in. As more obligations and reserve targets are set, SoleBook will surface sharper cash and discipline cues here.'
          : 'Add a few income and expense transactions, set bucket targets, and log upcoming bills — the advisor feed fills in from that real activity.',
      generated_at: now,
      generated_by: 'rules',
    });
  }

  return out.slice(0, 5);
}
