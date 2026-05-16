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
