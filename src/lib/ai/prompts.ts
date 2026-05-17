export const PROMPT_VERSION = 'v1.0';

export const SYSTEM_PROMPT = `You are SoleBook AI Advisor, a financial discipline coach for Sri Lankan sole proprietors and small business owners.

Your role:
- Provide actionable financial advice based on the business data provided
- Explain financial concepts in simple terms (support English, Sinhala, Tamil)
- Help owners understand their cash flow, spending patterns, and financial health
- Suggest improvements to financial discipline score
- Never recommend specific investment products or guarantee outcomes

You MUST NOT:
- Suggest transferring money or making payments (the owner decides)
- Approve or reject any financial transaction
- Access, store, or display bank account numbers
- Provide tax filing advice (suggest consulting a professional)
- Make promises about loan approval

Respond conversationally and supportively. The owner is often juggling personal and business finances with limited formal training.`;

function runwayContextLine(days: number | null): string {
  return days === null
    ? 'Not estimated — no trailing 30-day expense outflows, so daily burn is unknown'
    : `${days} days`;
}

export function buildChatContext(data: {
  disciplineScore: number;
  cashRunway: number | null;
  bucketBalances: Record<string, number>;
  upcomingObligations: { category: string; amount: number; dueDate: string }[];
  recentInsights: string[];
  monthlyRevenue: number;
  monthlyExpenses: number;
  language: string;
}): string {
  const lang = data.language === 'si' ? 'Respond in Sinhala.' : data.language === 'ta' ? 'Respond in Tamil.' : '';

  return `Current Business Context:
- Financial Discipline Score: ${data.disciplineScore}/100
- Cash Runway: ${runwayContextLine(data.cashRunway)}
- Monthly Revenue: LKR ${data.monthlyRevenue.toLocaleString()}
- Monthly Expenses: LKR ${data.monthlyExpenses.toLocaleString()}
- Bucket Balances: Operations=${data.bucketBalances.operations?.toLocaleString() || 0}, Obligations=${data.bucketBalances.obligations?.toLocaleString() || 0}, Reserve=${data.bucketBalances.profit_reserve?.toLocaleString() || 0}, Owner Salary=${data.bucketBalances.owner_salary?.toLocaleString() || 0}, Growth=${data.bucketBalances.growth?.toLocaleString() || 0}
- Upcoming Payments (next 30d): ${data.upcomingObligations.map(o => `${o.category} LKR ${o.amount.toLocaleString()} due ${o.dueDate}`).join('; ')}
- Recent Insights: ${data.recentInsights.join('; ')}
${lang}`;
}

export function buildInsightsPrompt(data: {
  transactions30Days: { direction: string; amount: number; category: string; date: string }[];
  disciplineScore: number;
  cashRunway: number;
  reserveHealth: number;
}): string {
  return `Analyze this 30-day financial behavior and provide 3-5 actionable insights.

Data:
- Discipline Score: ${data.disciplineScore}/100
- Cash Runway: ${data.cashRunway} days
- Reserve Health: ${data.reserveHealth}%
- Transaction Summary (last 30 days):
  Total Inflow: LKR ${data.transactions30Days.filter(t => t.direction === 'inflow').reduce((s, t) => s + t.amount, 0).toLocaleString()}
  Total Outflow: LKR ${data.transactions30Days.filter(t => t.direction === 'outflow').reduce((s, t) => s + t.amount, 0).toLocaleString()}
  Top Categories: ${JSON.stringify(getCategoryTotals(data.transactions30Days))}

Format each insight as JSON array:
[{"category": "cash_risk|discipline|leakage|supplier_risk|reserve_health|forecast", "severity": "info|warning|critical", "title": "short title", "body": "detailed explanation with numbers"}]

Be specific with Sri Lankan business context. Use LKR amounts.`;
}

function getCategoryTotals(transactions: { category: string; amount: number }[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const tx of transactions) {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
  }
  return totals;
}
