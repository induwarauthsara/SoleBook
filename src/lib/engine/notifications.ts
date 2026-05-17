export interface NotificationPayload {
  orgId: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

export function generateObligationDueNotification(
  obligation: { id: string; category: string; counterpartyAlias: string; amount: number; dueDate: string },
  daysUntilDue: number
): NotificationPayload | null {
  if (daysUntilDue > 3 || daysUntilDue < 0) return null;

  return {
    orgId: '',
    type: 'obligation_due',
    title: `Payment due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} days`}`,
    body: `${obligation.counterpartyAlias || obligation.category}: LKR ${obligation.amount.toLocaleString()}`,
    metadata: { obligation_id: obligation.id, days_until_due: daysUntilDue },
  };
}

export function generateLowReserveNotification(
  currentPct: number,
  targetPct: number
): NotificationPayload | null {
  if (currentPct >= targetPct * 0.5) return null;

  return {
    orgId: '',
    type: 'low_reserve',
    title: 'Profit reserve critically low',
    body: `Reserve is at ${Math.round(currentPct)}% of target. Consider reducing discretionary spending.`,
    metadata: { current_pct: currentPct, target_pct: targetPct },
  };
}

export function generateLeakageNotification(
  amount: number,
  salaryGoal: number,
  totalWithdrawn: number
): NotificationPayload | null {
  if (totalWithdrawn <= salaryGoal) return null;

  return {
    orgId: '',
    type: 'owner_leakage',
    title: 'Owner withdrawal exceeded plan',
    body: `Total withdrawals (LKR ${totalWithdrawn.toLocaleString()}) exceed salary plan (LKR ${salaryGoal.toLocaleString()}).`,
    metadata: { amount, salary_goal: salaryGoal, total_withdrawn: totalWithdrawn },
  };
}

export function generateRunwayCriticalNotification(
  daysRemaining: number
): NotificationPayload | null {
  if (daysRemaining >= 7) return null;

  return {
    orgId: '',
    type: 'cash_runway_critical',
    title: 'Cash runway critical',
    body: `At current pace, funds may run out in ${daysRemaining} days. Consider delaying non-urgent payments.`,
    metadata: { days_remaining: daysRemaining },
  };
}

export function generateDuplicatePaymentNotification(
  transactionId: string,
  counterparty: string,
  amount: number,
  confidence: string
): NotificationPayload | null {
  return {
    orgId: '',
    type: 'duplicate_payment',
    title: 'Possible duplicate payment detected',
    body: `Payment to ${counterparty} for LKR ${amount.toLocaleString()} may be a duplicate (${confidence} confidence).`,
    metadata: { transaction_id: transactionId, confidence },
  };
}
