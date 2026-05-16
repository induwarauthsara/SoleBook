export interface ERPAuthResponse {
  token: string;
  expires_at: string;
}

export interface ERPMetaData {
  business_name: string;
  business_type: string;
  registration_number: string;
  tax_id: string;
}

export interface ERPFinancialSnapshot {
  period: { from: string; to: string };
  sales_total: number;
  purchase_total: number;
  outstanding_receivables: number;
  outstanding_payables: number;
  inventory_value: number;
  payroll_total: number;
  expenses: { category: string; amount: number }[];
  recent_transactions: ERPTransaction[];
}

export interface ERPTransaction {
  id: string;
  type: 'sale' | 'purchase' | 'expense' | 'payment';
  amount: number;
  date: string;
  description: string;
  counterparty: string;
  reference: string;
}

export interface ERPPaymentPush {
  payment_reference: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  description: string;
}

export interface ERPSyncResult {
  success: boolean;
  records_pulled: number;
  records_pushed: number;
  errors: string[];
  data_hash: string;
}
