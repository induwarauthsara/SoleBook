export type BusinessType =
  | "retail"
  | "restaurant"
  | "services"
  | "wholesale"
  | "online"
  | "freelancer";

export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type TransactionType = "income" | "expense" | "transfer";
export type BucketName =
  | "operations"
  | "obligations"
  | "reserve"
  | "owner_salary"
  | "growth";
export type InsightSeverity = "critical" | "warning" | "info" | "positive";
export type ObligationStatus = "pending" | "paid" | "overdue";

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  type: BusinessType;
  salary_goal: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  bucket?: BucketName;
}

export interface Bucket {
  id: string;
  business_id: string;
  name: BucketName;
  label: string;
  balance: number;
  target_pct: number;
  color: string;
  icon: string;
  description: string;
}

export interface Obligation {
  id: string;
  business_id: string;
  name: string;
  amount: number;
  due_date: string;
  priority: Priority;
  status: ObligationStatus;
  category: string;
  recurring: boolean;
}

export interface AllocationSplit {
  bucket: BucketName;
  amount: number;
  pct: number;
}

export interface Allocation {
  id: string;
  business_id: string;
  transaction_id: string;
  total_amount: number;
  splits: AllocationSplit[];
  accepted_at: string | null;
  created_at: string;
}

export interface AIInsight {
  id: string;
  business_id: string;
  message: string;
  detail?: string;
  severity: InsightSeverity;
  category: string;
  action?: string;
  created_at: string;
}

export interface DisciplineScore {
  id: string;
  business_id: string;
  overall: number;
  payment_timeliness: number;
  reserve_consistency: number;
  salary_stability: number;
  personal_leakage: number;
  loan_readiness: number;
  computed_at: string;
}

export interface CashForecastPoint {
  date: string;
  projected_balance: number;
  obligations: number;
  income_expected: number;
  risk_level: "safe" | "warning" | "danger";
}

export interface OwnerWithdrawal {
  id: string;
  business_id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface OnboardingState {
  step: number;
  mode: "demo" | "live";
  businessType: BusinessType | null;
  businessName: string;
  salaryGoal: number;
  bucketConfig: Partial<Record<BucketName, number>>;
}
