export type ERPAuthMethod = 'api_key' | 'password_jwt';

/** Auth response from SoleBook integration `auth/token.php`. */
export interface ERPAuthResponse {
  token: string;
  expires_in?: number;
  expires_at?: string;
}

export interface ERPMetaData {
  business_name?: string;
  business_type?: string;
  registration_number?: string;
  tax_id?: string;
  [key: string]: unknown;
}

export interface ERPFinancialSnapshot {
  period?: { from?: string; to?: string };
  sales_total?: number;
  purchase_total?: number;
  outstanding_receivables?: number;
  outstanding_payables?: number;
  inventory_value?: number;
  payroll_total?: number;
  expenses?: { category: string; amount: number }[];
  recent_transactions: ERPTransaction[];
}

export type ERPTransactionType =
  | 'sale'
  | 'purchase'
  | 'expense'
  | 'payment'
  | 'transfer'
  | string;

export interface ERPTransaction {
  id: string;
  type: ERPTransactionType;
  amount: number;
  date: string;
  description: string;
  counterparty: string;
  reference: string;
}

/** @deprecated SoleBook ERP uses invoice_balance.php with a different body — use ERPInvoiceBalancePayment. */
export interface ERPPaymentPush {
  payment_reference: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  description: string;
}

/** POST `payments/invoice_balance.php` (Srijaya docs). */
export interface ERPInvoiceBalancePayment {
  invoice_number: string;
  amount: number;
  source?: 'deposit' | 'wallet';
  account_name?: string;
  solebook_reference?: string;
}

export interface ERPSyncResult {
  success: boolean;
  records_pulled: number;
  records_pushed: number;
  errors: string[];
  data_hash: string;
}

/** Query params for `snapshot.php` (Srijaya). */
export interface ERPSnapshotQuery {
  from?: string;
  to?: string;
  branch_id?: string;
  privacy?: 'strict';
}

export type ErpSyncEntity = 'recent_transactions' | 'expense_rollups' | 'meta';

/** Org-level defaults (also storable under `integrations.metadata.erp_sync`). */
export interface ErpSyncSelection {
  entities?: ErpSyncEntity[];
  snapshot_params?: ERPSnapshotQuery;
  transaction_types?: string[];
}
