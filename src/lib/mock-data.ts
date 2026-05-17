import type {
  AIInsight,
  BankAccount,
  LinkedPaymentCard,
  Bucket,
  Business,
  CashForecastPoint,
  DisciplineScore,
  Obligation,
  OwnerWithdrawal,
  Transaction,
  UserProfile,
} from "@/types/app";

/**
 * Demo / placeholder data for story-style fixtures and empty-state shapes.
 * Live chat and insights are loaded from the API; see `/api/ai/chat` and
 * `/api/dashboard`.
 */

export const mockUser: UserProfile = {
  id: "user-001",
  name: "Nimal Perera",
  email: "nimal@nilamart.lk",
  phone: "+94 77 555 1234",
  avatarColor: "#F27344",
};

export const mockBusiness: Business = {
  id: "biz-001",
  ownerId: mockUser.id,
  name: "Nila Mini Mart",
  type: "retail",
  salaryGoal: 80000,
  savingGoal: 50000,
  createdAt: "2025-01-01T00:00:00Z",
};

export const mockBuckets: Bucket[] = [
  {
    id: "b-1",
    businessId: mockBusiness.id,
    name: "operations",
    label: "Operations",
    balance: 245000,
    targetPct: 50,
    color: "#3B82F6",
    icon: "Briefcase",
    description: "Daily running costs, supplier payments, inventory.",
  },
  {
    id: "b-2",
    businessId: mockBusiness.id,
    name: "obligations",
    label: "Obligations",
    balance: 128000,
    targetPct: 25,
    color: "#F59E0B",
    icon: "AlertCircle",
    description: "Rent, salaries, utilities, loan repayments.",
  },
  {
    id: "b-3",
    businessId: mockBusiness.id,
    name: "reserve",
    label: "Profit Reserve",
    balance: 95000,
    targetPct: 15,
    color: "#22C55E",
    icon: "Shield",
    description: "Emergency buffer, growth capital, future investments.",
  },
  {
    id: "b-4",
    businessId: mockBusiness.id,
    name: "owner_salary",
    label: "Owner Salary",
    balance: 62000,
    targetPct: 8,
    color: "#F27344",
    icon: "User",
    description: "Structured personal compensation from business.",
  },
  {
    id: "b-5",
    businessId: mockBusiness.id,
    name: "growth",
    label: "Growth",
    balance: 28000,
    targetPct: 2,
    color: "#8B5CF6",
    icon: "TrendingUp",
    description: "Marketing, equipment, expansion investments.",
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: "t-1",
    businessId: mockBusiness.id,
    amount: 185000,
    type: "income",
    category: "Sales",
    description: "Daily sales deposit",
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    bucket: "operations",
    source: "bank",
  },
  {
    id: "t-2",
    businessId: mockBusiness.id,
    amount: 42000,
    type: "expense",
    category: "Inventory",
    description: "Stock purchase — suppliers",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    bucket: "operations",
    source: "manual",
  },
  {
    id: "t-3",
    businessId: mockBusiness.id,
    amount: 35000,
    type: "expense",
    category: "Salary",
    description: "Staff salary — May",
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    bucket: "obligations",
    source: "bank",
  },
  {
    id: "t-4",
    businessId: mockBusiness.id,
    amount: 220000,
    type: "income",
    category: "Sales",
    description: "Weekend sales deposit",
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    bucket: "operations",
    source: "bank",
  },
  {
    id: "t-5",
    businessId: mockBusiness.id,
    amount: 12500,
    type: "expense",
    category: "Utilities",
    description: "Electricity bill",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    bucket: "obligations",
    source: "erp",
  },
  {
    id: "t-6",
    businessId: mockBusiness.id,
    amount: 80000,
    type: "transfer",
    category: "Owner Salary",
    description: "Owner salary transfer",
    date: new Date(Date.now() - 6 * 86400000).toISOString(),
    bucket: "owner_salary",
    source: "manual",
  },
  {
    id: "t-7",
    businessId: mockBusiness.id,
    amount: 165000,
    type: "income",
    category: "Sales",
    description: "Weekday sales",
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    bucket: "operations",
    source: "bank",
  },
  {
    id: "t-8",
    businessId: mockBusiness.id,
    amount: 8500,
    type: "expense",
    category: "Transport",
    description: "Delivery fuel costs",
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    bucket: "operations",
    source: "manual",
  },
  {
    id: "t-9",
    businessId: mockBusiness.id,
    amount: 14200,
    type: "expense",
    category: "Inventory",
    description: "Beverages restock",
    date: new Date(Date.now() - 9 * 86400000).toISOString(),
    bucket: "operations",
    source: "erp",
  },
  {
    id: "t-10",
    businessId: mockBusiness.id,
    amount: 92000,
    type: "income",
    category: "Sales",
    description: "Tuesday sales deposit",
    date: new Date(Date.now() - 10 * 86400000).toISOString(),
    bucket: "operations",
    source: "bank",
  },
];

export const mockObligations: Obligation[] = [
  {
    id: "o-1",
    businessId: mockBusiness.id,
    name: "Shop Rent",
    amount: 65000,
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    priority: "HIGH",
    status: "pending",
    category: "Rent",
    recurring: true,
    group: "rent",
  },
  {
    id: "o-2",
    businessId: mockBusiness.id,
    name: "Staff Salaries (3 employees)",
    amount: 105000,
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    priority: "HIGH",
    status: "pending",
    category: "Salaries",
    recurring: true,
    group: "staff",
  },
  {
    id: "o-3",
    businessId: mockBusiness.id,
    name: "Electricity Bill",
    amount: 12800,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    priority: "MEDIUM",
    status: "pending",
    category: "Utilities",
    recurring: true,
    group: "utilities",
  },
  {
    id: "o-4",
    businessId: mockBusiness.id,
    name: "Seylan Bank Loan EMI",
    amount: 28500,
    dueDate: new Date(Date.now() + 9 * 86400000).toISOString(),
    priority: "HIGH",
    status: "pending",
    category: "Loan",
    recurring: true,
    group: "loan",
  },
  {
    id: "o-5",
    businessId: mockBusiness.id,
    name: "Internet & Wi-Fi",
    amount: 3500,
    dueDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    priority: "LOW",
    status: "pending",
    category: "Utilities",
    recurring: true,
    group: "utilities",
  },
  {
    id: "o-6",
    businessId: mockBusiness.id,
    name: "Colombo Textiles — supplier invoice",
    amount: 48000,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    priority: "MEDIUM",
    status: "pending",
    category: "Supplier",
    recurring: false,
    group: "suppliers",
  },
  {
    id: "o-7",
    businessId: mockBusiness.id,
    name: "EPF/ETF contribution",
    amount: 21000,
    dueDate: new Date(Date.now() + 18 * 86400000).toISOString(),
    priority: "HIGH",
    status: "pending",
    category: "Compliance",
    recurring: true,
    group: "staff",
  },
  {
    id: "o-8",
    businessId: mockBusiness.id,
    name: "Water Bill",
    amount: 2200,
    dueDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    priority: "LOW",
    status: "paid",
    category: "Utilities",
    recurring: true,
    group: "utilities",
  },
];

export const mockInsights: AIInsight[] = [
  {
    id: "i-1",
    businessId: mockBusiness.id,
    message: "Supplier payment may fall short in 9 days",
    detail:
      "At the current spending pace, your operations bucket will dip below Rs. 48,000 before the Colombo Textiles invoice is due.",
    severity: "critical",
    category: "Cash Flow",
    action: "Review allocation",
    createdAt: new Date().toISOString(),
  },
  {
    id: "i-2",
    businessId: mockBusiness.id,
    message: "Owner withdrawals are 22% above plan",
    detail:
      "You drew Rs. 97,600 this month against the recommended Rs. 80,000 — this can delay May payroll if uncorrected.",
    severity: "warning",
    category: "Personal Leakage",
    action: "View owner salary",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "i-3",
    businessId: mockBusiness.id,
    message: "Profit reserve is shrinking",
    detail:
      "Reserve contributions dropped 40% vs. last month. Consider shifting 5% from operations.",
    severity: "warning",
    category: "Savings",
    action: "Adjust allocation",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "i-4",
    businessId: mockBusiness.id,
    message: "Shop rent due in 3 days — reserve is ready",
    detail:
      "Rs. 65,000 has been pre-reserved for shop rent. Payment can be made on time.",
    severity: "info",
    category: "Obligations",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "i-5",
    businessId: mockBusiness.id,
    message: "Revenue up 18% this month",
    detail:
      "May revenue is tracking at Rs. 892,000 vs Rs. 755,000 in April. A great moment to grow the reserve.",
    severity: "positive",
    category: "Revenue",
    action: "Optimise allocation",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "i-6",
    businessId: mockBusiness.id,
    message: "Loan readiness improved to 68",
    detail:
      "Consistent on-time payments and a steadier reserve are improving your banking profile. 80+ unlocks preferential rates.",
    severity: "positive",
    category: "Banking",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export const mockScore: DisciplineScore = {
  id: "s-1",
  businessId: mockBusiness.id,
  overall: 68,
  paymentTimeliness: 82,
  reserveConsistency: 54,
  salaryStability: 71,
  personalLeakage: 59,
  loanReadiness: 68,
  computedAt: new Date().toISOString(),
};

export const mockOwnerWithdrawals: OwnerWithdrawal[] = [
  {
    id: "ow-1",
    businessId: mockBusiness.id,
    amount: 80000,
    date: new Date(Date.now() - 6 * 86400000).toISOString(),
    note: "Monthly salary",
  },
  {
    id: "ow-2",
    businessId: mockBusiness.id,
    amount: 17600,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    note: "Personal expense",
  },
];

export const mockAccounts: BankAccount[] = [
  {
    id: "ba-1",
    bank: "Commercial Bank",
    alias: "Business Current",
    last4: "4821",
    type: "current",
    balance: 558000,
    currency: "LKR",
  },
  {
    id: "ba-2",
    bank: "Sampath Bank",
    alias: "Reserve Savings",
    last4: "2207",
    type: "savings",
    balance: 142000,
    currency: "LKR",
  },
];

/** Sample debit cards for demo sandbox UI (paired with linked accounts conceptually). */
export const mockPaymentCards: LinkedPaymentCard[] = [
  {
    id: "pc-1",
    brand: "visa",
    label: "Business debit",
    last4: "4821",
    expiry: "08/27",
  },
  {
    id: "pc-2",
    brand: "mastercard",
    label: "Operating card",
    last4: "9012",
    expiry: "03/26",
  },
];

export function sumAccountBalances(accts: Pick<BankAccount, "balance">[]): number {
  return accts.reduce((s, a) => s + a.balance, 0);
}

export function generateForecast(): CashForecastPoint[] {
  // Deterministic, seeded by index so the same demo renders identically
  // across reloads (rather than the jittery rand variant from FE1).
  const points: CashForecastPoint[] = [];
  let balance = 558000;

  for (let i = 0; i <= 30; i++) {
    const date = new Date(Date.now() + i * 86400000);
    const isPayday = i === 5 || i === 15 || i === 25;
    const isExpenseDay = i === 3 || i === 9 || i === 14 || i === 18;

    const income = isPayday ? 180000 + (i % 3) * 25000 : 0;
    const obligations = isExpenseDay ? 45000 + (i % 4) * 6000 : 0;
    const dailyBurn = 6500;

    balance = balance + income - obligations - dailyBurn;
    const riskLevel =
      balance < 100000 ? "danger" : balance < 200000 ? "warning" : "safe";

    points.push({
      date: date.toISOString().split("T")[0],
      projectedBalance: Math.max(balance, 0),
      obligations,
      incomeExpected: income,
      riskLevel,
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
  cashRunway: 19 as number | null,
};

/** Zeroed metrics — use as the default before `/api/dashboard` loads (never substitute mock “demo” numbers for real users). */
export const emptyDashboardMetrics: typeof mockMetrics = {
  currentBalance: 0,
  monthlyRevenue: 0,
  monthlyExpenses: 0,
  reserveHealth: 0,
  disciplineScore: 0,
  pendingObligations: 0,
  ownerSalaryGoal: 0,
  ownerTotalWithdrawn: 0,
  avgDailySales: 0,
  cashRunway: 0 as number | null,
};

export const emptyBusiness: Business = {
  id: "",
  ownerId: "",
  name: "",
  type: "other",
  salaryGoal: 0,
  createdAt: "",
};

export const emptyDisciplineScore: DisciplineScore = {
  id: "",
  businessId: "",
  overall: 0,
  paymentTimeliness: 0,
  reserveConsistency: 0,
  salaryStability: 0,
  personalLeakage: 0,
  loanReadiness: 0,
  computedAt: "",
};
