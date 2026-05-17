import { ERPTransaction } from './types';

export interface NormalizedTransaction {
  external_id: string;
  direction: 'inflow' | 'outflow';
  amount_lkr: number;
  occurred_at: string;
  description_clean: string;
  counterparty_alias: string;
  category: string;
  source: 'erp';
}

export function normalizeERPTransactions(erpTransactions: ERPTransaction[]): NormalizedTransaction[] {
  return erpTransactions.map(tx => ({
    external_id: tx.id,
    direction: tx.type === 'sale' ? 'inflow' : 'outflow',
    amount_lkr: tx.amount,
    occurred_at: tx.date,
    description_clean: tx.description,
    counterparty_alias: tx.counterparty,
    category: mapERPCategory(tx.type, tx.description),
    source: 'erp' as const,
  }));
}

function slugCategory(s: string): string {
  const t = s.replace(/[^\w.-]+/g, '_').slice(0, 80);
  return t || 'category';
}

/** One normalized outflow per expense category for a snapshot period (dedupe via stable `external_id`). */
export function normalizeExpenseRollups(
  expenses: { category: string; amount: number }[],
  period?: { from?: string; to?: string },
): NormalizedTransaction[] {
  const from = period?.from || 'na';
  const to = period?.to || 'na';
  const occurred = period?.to || period?.from || new Date().toISOString().slice(0, 10);

  return expenses.map((e) => ({
    external_id: `expense_rollup:${slugCategory(e.category)}:${from}:${to}`,
    direction: 'outflow' as const,
    amount_lkr: e.amount,
    occurred_at: occurred,
    description_clean: `ERP expense rollup: ${e.category}`,
    counterparty_alias: '',
    category: mapERPCategory('expense', e.category),
    source: 'erp' as const,
  }));
}

function mapERPCategory(type: string, description: string): string {
  const desc = description.toLowerCase();
  if (type === 'sale') return 'sales';
  if (desc.includes('salary') || desc.includes('payroll')) return 'payroll';
  if (desc.includes('rent')) return 'rent';
  if (desc.includes('electricity') || desc.includes('water') || desc.includes('utility')) return 'utilities';
  if (desc.includes('supplier') || desc.includes('inventory') || desc.includes('purchase')) return 'cogs';
  if (desc.includes('loan') || desc.includes('installment')) return 'loan';
  if (desc.includes('tax') || desc.includes('epf') || desc.includes('etf')) return 'tax';
  return 'other';
}
