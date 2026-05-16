/**
 * App-layer types — what the dashboard and onboarding consume.
 *
 * These are intentionally simple, denormalized, and friendly to mock
 * data. When a real backend lands, replace the mock store with a
 * provider that fetches and emits the same shapes.
 */

export type BusinessType =
  | "retail"
  | "restaurant"
  | "services"
  | "wholesale"
  | "online"
  | "freelancer"
  | "other";

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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarColor?: string;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  type: BusinessType;
  typeOther?: string;
  salaryGoal: number;
  savingGoal?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  businessId: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  bucket?: BucketName;
  source?: "manual" | "erp" | "bank";
}

export interface Bucket {
  id: string;
  businessId: string;
  name: BucketName;
  label: string;
  balance: number;
  targetPct: number;
  color: string;
  icon: string;
  description: string;
}

export interface Obligation {
  id: string;
  businessId: string;
  name: string;
  amount: number;
  dueDate: string;
  priority: Priority;
  status: ObligationStatus;
  category: string;
  recurring: boolean;
  /** suppliers | utilities | staff | rent | loan | other */
  group?: "suppliers" | "utilities" | "staff" | "rent" | "loan" | "other";
}

export interface AIInsight {
  id: string;
  businessId: string;
  message: string;
  detail?: string;
  severity: InsightSeverity;
  category: string;
  action?: string;
  createdAt: string;
}

export interface DisciplineScore {
  id: string;
  businessId: string;
  overall: number;
  paymentTimeliness: number;
  reserveConsistency: number;
  salaryStability: number;
  personalLeakage: number;
  loanReadiness: number;
  computedAt: string;
}

export interface CashForecastPoint {
  date: string;
  projectedBalance: number;
  obligations: number;
  incomeExpected: number;
  riskLevel: "safe" | "warning" | "danger";
}

export interface OwnerWithdrawal {
  id: string;
  businessId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface BankAccount {
  id: string;
  bank: string;
  alias: string;
  last4: string;
  type: "current" | "savings";
  balance: number;
  currency: "LKR";
}

export interface OnboardingState {
  step: number;
  ownerName: string;
  businessName: string;
  businessType: BusinessType | null;
  businessTypeOther?: string;
  accountConnected: boolean;
  savingGoal: number;
  done: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
