import type {
  Business,
  Transaction,
  Bucket,
  Obligation,
  AIInsight,
  DisciplineScore,
  CashForecastPoint,
  OwnerWithdrawal,
} from "@/types";

export const mockBusiness: Business = {
  id: "biz-001",
  owner_id: "user-001",
  name: "Nimal's Retail Store",
  type: "retail",
  salary_goal: 80000,
  created_at: "2025-01-01T00:00:00Z",
};

export const mockBuckets: Bucket[] = [
  {
    id: "b-1",
    business_id: "biz-001",
    name: "operations",
    label: "Operations",
    balance: 245000,
    target_pct: 50,
    color: "#3B82F6",
    icon: "Briefcase",
    description: "Daily running costs, supplier payments, inventory",
  },
  {
    id: "b-2",
    business_id: "biz-001",
    name: "obligations",
    label: "Obligations",
    balance: 128000,
    target_pct: 25,
    color: "#F59E0B",
    icon: "AlertCircle",
    description: "Rent, salaries, utilities, loan repayments",
  },
  {
    id: "b-3",
    business_id: "biz-001",
    name: "reserve",
    label: "Profit Reserve",
    balance: 95000,
    target_pct: 15,
    color: "#22C55E",
    icon: "Shield",
    description: "Emergency buffer, growth capital, future investments",
  },
  {
    id: "b-4",
    business_id: "biz-001",
    name: "owner_salary",
    label: "Owner Salary",
    balance: 62000,
    target_pct: 8,
    color: "#F27344",
    icon: "User",
    description: "Structured personal compensation from business",
  },
  {
    id: "b-5",
    business_id: "biz-001",
    name: "growth",
    label: "Growth",
    balance: 28000,
    target_pct: 2,
    color: "#8B5CF6",
    icon: "TrendingUp",
    description: "Marketing, equipment, expansion investments",
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: "t-1",
    business_id: "biz-001",
    amount: 185000,
    type: "income",
    category: "Sales",
    description: "Daily sales deposit",
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    bucket: "operations",
  },
  {
    id: "t-2",
    business_id: "biz-001",
    amount: 42000,
    type: "expense",
    category: "Inventory",
    description: "Stock purchase – suppliers",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    bucket: "operations",
  },
  {
    id: "t-3",
    business_id: "biz-001",
    amount: 35000,
    type: "expense",
    category: "Salary",
    description: "Staff salary – May",
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    bucket: "obligations",
  },
  {
    id: "t-4",
    business_id: "biz-001",
    amount: 220000,
    type: "income",
    category: "Sales",
    description: "Weekend sales deposit",
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    bucket: "operations",
  },
  {
    id: "t-5",
    business_id: "biz-001",
    amount: 12500,
    type: "expense",
    category: "Utilities",
    description: "Electricity bill",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    bucket: "obligations",
  },
  {
    id: "t-6",
    business_id: "biz-001",
    amount: 80000,
    type: "transfer",
    category: "Owner Salary",
    description: "Owner salary transfer",
    date: new Date(Date.now() - 6 * 86400000).toISOString(),
    bucket: "owner_salary",
  },
  {
    id: "t-7",
    business_id: "biz-001",
    amount: 165000,
    type: "income",
    category: "Sales",
    description: "Weekday sales",
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    bucket: "operations",
  },
  {
    id: "t-8",
    business_id: "biz-001",
    amount: 8500,
    type: "expense",
    category: "Transport",
    description: "Delivery fuel costs",
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    bucket: "operations",
  },
];

export const mockObligations: Obligation[] = [
  {
    id: "o-1",
    business_id: "biz-001",
    name: "Shop Rent",
    amount: 65000,
    due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    priority: "HIGH",
    status: "pending",
    category: "Rent",
    recurring: true,
  },
  {
    id: "o-2",
    business_id: "biz-001",
    name: "Staff Salaries (3 employees)",
    amount: 105000,
    due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    priority: "HIGH",
    status: "pending",
    category: "Salaries",
    recurring: true,
  },
  {
    id: "o-3",
    business_id: "biz-001",
    name: "Electricity Bill",
    amount: 12800,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    priority: "MEDIUM",
    status: "pending",
    category: "Utilities",
    recurring: true,
  },
  {
    id: "o-4",
    business_id: "biz-001",
    name: "Seylan Bank Loan EMI",
    amount: 28500,
    due_date: new Date(Date.now() + 9 * 86400000).toISOString(),
    priority: "HIGH",
    status: "pending",
    category: "Loan",
    recurring: true,
  },
  {
    id: "o-5",
    business_id: "biz-001",
    name: "Internet & Wi-Fi",
    amount: 3500,
    due_date: new Date(Date.now() + 12 * 86400000).toISOString(),
    priority: "LOW",
    status: "pending",
    category: "Utilities",
    recurring: true,
  },
  {
    id: "o-6",
    business_id: "biz-001",
    name: "Supplier Invoice – Colombo Textiles",
    amount: 48000,
    due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    priority: "MEDIUM",
    status: "pending",
    category: "Supplier",
    recurring: false,
  },
  {
    id: "o-7",
    business_id: "biz-001",
    name: "EPF/ETF Contribution",
    amount: 21000,
    due_date: new Date(Date.now() + 18 * 86400000).toISOString(),
    priority: "HIGH",
    status: "pending",
    category: "Compliance",
    recurring: true,
  },
  {
    id: "o-8",
    business_id: "biz-001",
    name: "Water Bill",
    amount: 2200,
    due_date: new Date(Date.now() + 20 * 86400000).toISOString(),
    priority: "LOW",
    status: "paid",
    category: "Utilities",
    recurring: true,
  },
];

export const mockInsights: AIInsight[] = [
  {
    id: "i-1",
    business_id: "biz-001",
    message: "Supplier payment may fail in 9 days",
    detail:
      "Based on current spending, your operations bucket will fall below Rs. 48,000 before the Colombo Textiles invoice is due.",
    severity: "critical",
    category: "Cash Flow",
    action: "Review Allocation",
    created_at: new Date().toISOString(),
  },
  {
    id: "i-2",
    business_id: "biz-001",
    message: "Owner withdrawals exceeded limit by 22%",
    detail:
      "You withdrew Rs. 97,600 this month against a recommended Rs. 80,000. This may delay May payroll.",
    severity: "warning",
    category: "Personal Leakage",
    action: "View Owner Salary",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "i-3",
    business_id: "biz-001",
    message: "Profit reserve is shrinking",
    detail:
      "Reserve contributions dropped 40% vs. last month. Consider increasing allocation by 5% from operations.",
    severity: "warning",
    category: "Savings",
    action: "Adjust Allocation",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "i-4",
    business_id: "biz-001",
    message: "Shop rent due in 3 days — reserve ready",
    detail:
      "Rs. 65,000 has been pre-reserved for shop rent. Payment can be made on time.",
    severity: "info",
    category: "Obligations",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "i-5",
    business_id: "biz-001",
    message: "Revenue up 18% this month — great momentum",
    detail:
      "May revenue is tracking at Rs. 892,000 vs Rs. 755,000 in April. Consider increasing reserve contributions.",
    severity: "positive",
    category: "Revenue",
    action: "Optimize Allocation",
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "i-6",
    business_id: "biz-001",
    message: "Loan readiness score improved to 68",
    detail:
      "Consistent on-time payments and reserve growth improved your banking profile. 80+ unlocks preferential loan rates.",
    severity: "positive",
    category: "Banking",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export const mockScore: DisciplineScore = {
  id: "s-1",
  business_id: "biz-001",
  overall: 68,
  payment_timeliness: 82,
  reserve_consistency: 54,
  salary_stability: 71,
  personal_leakage: 59,
  loan_readiness: 68,
  computed_at: new Date().toISOString(),
};

export const mockOwnerWithdrawals: OwnerWithdrawal[] = [
  {
    id: "ow-1",
    business_id: "biz-001",
    amount: 80000,
    date: new Date(Date.now() - 6 * 86400000).toISOString(),
    note: "Monthly salary",
  },
  {
    id: "ow-2",
    business_id: "biz-001",
    amount: 17600,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    note: "Personal expense",
  },
];

export function generateForecast(): CashForecastPoint[] {
  const points: CashForecastPoint[] = [];
  let balance = 558000;

  for (let i = 0; i <= 30; i++) {
    const date = new Date(Date.now() + i * 86400000);
    const isPayday = i === 5 || i === 15 || i === 25;
    const isExpenseDay = i === 3 || i === 9 || i === 14 || i === 18;

    const income = isPayday ? Math.random() * 120000 + 150000 : 0;
    const obligations = isExpenseDay ? Math.random() * 50000 + 30000 : 0;

    balance = balance + income - obligations - (Math.random() * 8000 + 5000);

    const riskLevel =
      balance < 100000 ? "danger" : balance < 200000 ? "warning" : "safe";

    points.push({
      date: date.toISOString().split("T")[0],
      projected_balance: Math.max(balance, 0),
      obligations,
      income_expected: income,
      risk_level: riskLevel,
    });
  }

  return points;
}

export const mockMetrics = {
  currentBalance: 558000,
  monthlyRevenue: 892000,
  monthlyExpenses: 412000,
  reserveHealth: 62,
  disciplineScore: 68,
  pendingObligations: 263000,
  ownerSalaryGoal: 80000,
  ownerTotalWithdrawn: 97600,
  avgDailySales: 29733,
  cashRunway: 19,
};
