export interface RunwayInput {
  currentBalance: number;
  avgDailyOutflow: number;
  avgDailyInflow: number;
  obligationsDueNext30Days: { amount: number; dueDate: string }[];
  projectedInflow30Days: number;
}

export interface RunwayResult {
  daysUntilZero: number;
  riskBand: 'low' | 'medium' | 'high';
  status: 'comfortable' | 'balanced' | 'tight';
  forecast: { date: string; projectedBalance: number; riskLevel: string }[];
  obligationCoverage: number;
}

export function computeRunway(input: RunwayInput): RunwayResult {
  const { currentBalance, avgDailyOutflow, avgDailyInflow, obligationsDueNext30Days, projectedInflow30Days } = input;

  // Days until zero (without any inflow)
  const daysUntilZero = avgDailyOutflow > 0
    ? Math.floor(currentBalance / avgDailyOutflow)
    : 999;

  // Status bands
  const status = daysUntilZero > 30 ? 'comfortable' : daysUntilZero > 14 ? 'balanced' : 'tight';
  const riskBand = status === 'comfortable' ? 'low' : status === 'balanced' ? 'medium' : 'high';

  // Obligation coverage ratio
  const totalObligations = obligationsDueNext30Days.reduce((s, o) => s + o.amount, 0);
  const availableForObligations = currentBalance + projectedInflow30Days;
  const obligationCoverage = totalObligations > 0
    ? Math.round((availableForObligations / totalObligations) * 100)
    : 100;

  // 30-day forecast
  const forecast: RunwayResult['forecast'] = [];
  let balance = currentBalance;
  const today = new Date();

  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    balance = balance + avgDailyInflow - avgDailyOutflow;

    // Subtract obligations due on this day
    const dayObligations = obligationsDueNext30Days.filter(o => o.dueDate === dateStr);
    for (const ob of dayObligations) {
      balance -= ob.amount;
    }

    const riskLevel = balance > avgDailyOutflow * 14 ? 'low'
      : balance > avgDailyOutflow * 7 ? 'medium'
      : 'high';

    forecast.push({ date: dateStr, projectedBalance: Math.round(balance), riskLevel });
  }

  return { daysUntilZero, riskBand, status, forecast, obligationCoverage };
}
