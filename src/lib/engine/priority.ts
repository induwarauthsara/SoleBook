export interface Obligation {
  id: string;
  category: string;
  amount: number;
  dueDate: string;
  counterpartyAlias: string;
  status: string;
}

export interface PriorityResult {
  id: string;
  priority: 'high' | 'medium' | 'low';
  urgencyScore: number;
  reason: string;
}

const CATEGORY_BASE_PRIORITY: Record<string, number> = {
  payroll: 95,
  loan: 90,
  utilities: 80,
  rent: 75,
  tax: 70,
  supplier: 50,
  subscription: 30,
  other: 20,
};

export function rankObligations(obligations: Obligation[]): PriorityResult[] {
  const today = new Date();

  return obligations
    .filter(o => o.status !== 'paid' && o.status !== 'cancelled')
    .map(obligation => {
      const dueDate = new Date(obligation.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let urgencyScore = CATEGORY_BASE_PRIORITY[obligation.category] || 20;

      // Time urgency multiplier
      if (daysUntilDue < 0) urgencyScore += 30; // Overdue
      else if (daysUntilDue <= 3) urgencyScore += 20;
      else if (daysUntilDue <= 7) urgencyScore += 10;
      else if (daysUntilDue > 21) urgencyScore -= 10;

      urgencyScore = Math.max(0, Math.min(100, urgencyScore));

      const priority: 'high' | 'medium' | 'low' =
        urgencyScore >= 70 ? 'high' : urgencyScore >= 40 ? 'medium' : 'low';

      let reason = `${obligation.category} payment`;
      if (daysUntilDue < 0) reason += ' (OVERDUE)';
      else if (daysUntilDue <= 3) reason += ' (due within 3 days)';
      else if (daysUntilDue <= 7) reason += ' (due this week)';

      return { id: obligation.id, priority, urgencyScore, reason };
    })
    .sort((a, b) => b.urgencyScore - a.urgencyScore);
}
