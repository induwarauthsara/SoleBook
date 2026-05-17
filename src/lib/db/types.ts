/**
 * SoleBook database types.
 *
 * Hand-maintained TypeScript shape of the public schema defined in
 * `supabase/migrations/`. After you wire up the Supabase CLI you can
 * replace this with `supabase gen types typescript --local > types.ts`
 * — keep the same module path so callers don't have to change.
 */

export type OrgRole =
  | "owner"
  | "finance"
  | "read_only"
  | "integration_admin";

export type BusinessTypeEnum =
  | "retail"
  | "restaurant"
  | "services"
  | "manufacturing"
  | "wholesale"
  | "agriculture"
  | "other";

export type BucketType =
  | "operations"
  | "obligations"
  | "profit_reserve"
  | "owner_salary"
  | "growth";

export type AccountType = "bank" | "cash" | "virtual_bucket" | "wallet";

export type TransactionDirection = "inflow" | "outflow";
export type TransactionSource = "bank" | "pos" | "erp" | "manual";
export type TransactionStatus = "pending" | "posted" | "reversed";

export type ObligationStatus =
  | "upcoming"
  | "due_soon"
  | "overdue"
  | "paid"
  | "cancelled";

export type ObligationPriority = "high" | "medium" | "low";

export type ObligationCategory =
  | "rent"
  | "payroll"
  | "utilities"
  | "loan"
  | "supplier"
  | "tax"
  | "subscription"
  | "other";

export type AllocationStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "applied"
  | "superseded";

export type AllocationTrigger =
  | "income_detected"
  | "scheduled"
  | "manual"
  | "recompute";

export type IntegrationType = "bank" | "pos" | "erp";
export type IntegrationStatus =
  | "pending"
  | "active"
  | "error"
  | "revoked"
  | "expired";

export type InsightCategory =
  | "cash_risk"
  | "discipline"
  | "leakage"
  | "supplier_risk"
  | "reserve_health"
  | "forecast"
  | "recommendation"
  | "fraud_signal"
  | "other";

export type InsightSeverity = "info" | "warning" | "critical";
export type RiskBand = "low" | "medium" | "high";
export type AuditOutcome = "success" | "failure" | "denied";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface Organization extends Timestamps {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  currency: string;
  timezone: string;
  deleted_at: string | null;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  joined_at: string;
}

export interface BusinessProfile extends Timestamps {
  id: string;
  org_id: string;
  business_type: BusinessTypeEnum;
  target_owner_salary_lkr: number;
  monthly_revenue_band: string | null;
  staff_count_band: string | null;
  onboarding_complete: boolean;
}

export interface Account extends Timestamps {
  id: string;
  org_id: string;
  name: string;
  type: AccountType;
  bank_name: string | null;
  account_mask: string | null;
  currency: string;
  current_balance: number;
  is_primary: boolean;
}

export interface Integration extends Timestamps {
  id: string;
  org_id: string;
  type: IntegrationType;
  provider: string;
  display_name: string;
  status: IntegrationStatus;
  consent_scopes: string[];
  webhook_secret_ref: string | null;
  oauth_secret_ref: string | null;
  metadata: Json;
  last_synced_at: string | null;
  last_error: string | null;
  created_by: string | null;
}

export interface Transaction extends Timestamps {
  id: string;
  org_id: string;
  account_id: string | null;
  raw_id: string | null;
  direction: TransactionDirection;
  amount_lkr: number;
  currency: string;
  occurred_at: string;
  description_clean: string | null;
  counterparty_alias: string | null;
  category: string | null;
  source: TransactionSource;
  is_personal: boolean;
  is_duplicate_of: string | null;
  status: TransactionStatus;
}

export interface Bucket extends Timestamps {
  id: string;
  org_id: string;
  type: BucketType;
  name: string;
  target_pct: number;
  current_balance_lkr: number;
  target_minimum_lkr: number;
  display_order: number;
}

export interface Allocation extends Timestamps {
  id: string;
  org_id: string;
  trigger: AllocationTrigger;
  source_transaction_id: string | null;
  total_amount_lkr: number;
  status: AllocationStatus;
  engine_version: string;
  explanation: string | null;
  proposed_at: string;
  decided_at: string | null;
  decided_by: string | null;
}

export interface AllocationLine {
  id: string;
  allocation_id: string;
  bucket_id: string;
  proposed_amount_lkr: number;
  approved_amount_lkr: number | null;
  reason_code: string | null;
}

export interface Obligation extends Timestamps {
  id: string;
  org_id: string;
  bucket_id: string | null;
  category: ObligationCategory;
  counterparty_alias: string | null;
  amount_lkr: number;
  due_date: string;
  priority: ObligationPriority;
  status: ObligationStatus;
  recurrence: string | null;
  notes: string | null;
  paid_at: string | null;
  paid_transaction_id: string | null;
}

export interface OwnerWithdrawal {
  id: string;
  org_id: string;
  amount_lkr: number;
  withdrawn_at: string;
  is_within_salary_plan: boolean;
  transaction_id: string | null;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface DisciplineScore {
  id: string;
  org_id: string;
  snapshot_date: string;
  score: number;
  components: Json;
  created_at: string;
}

export interface Insight {
  id: string;
  org_id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  body: string | null;
  machine_reason_code: string | null;
  payload: Json;
  generated_by: string;
  ai_audit_id: number | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  expires_at: string | null;
  generated_at: string;
}

export interface AuditLogEntry {
  id: number;
  org_id: string | null;
  actor_user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  outcome: AuditOutcome;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json;
  created_at: string;
}

export interface AiAuditLogEntry {
  id: number;
  org_id: string | null;
  actor_user_id: string | null;
  model_id: string;
  prompt_template_version: string;
  context_schema_version: string;
  context_hash: string;
  rbac_role: OrgRole | null;
  input_class: string | null;
  policy_version: string | null;
  output_hash: string | null;
  output_passed_safety: boolean;
  denied_reasons: string[];
  latency_ms: number | null;
  created_at: string;
}
