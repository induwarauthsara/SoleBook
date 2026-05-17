import type { ERPFinancialSnapshot, ERPTransaction, ERPTransactionType } from './types';

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function pickString(r: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return fallback;
}

function pickNumber(r: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function parseTransactionRow(row: unknown, index: number): ERPTransaction | null {
  const r = asRecord(row);
  if (!r) return null;
  let id = pickString(r, ['id', 'external_id', 'transaction_id', 'tx_id', 'reference', 'ref']);
  if (!id) id = `idx_${index}`;
  const typeRaw = pickString(r, ['type', 'txn_type', 'kind'], 'payment').toLowerCase();
  const amount = Math.abs(pickNumber(r, ['amount', 'value', 'total', 'grand_total']));
  const date = pickString(r, ['date', 'occurred_at', 'created_at', 'posted_at', 'timestamp'], '');
  const description = pickString(r, ['description', 'narration', 'memo', 'note', 'title'], '');
  const counterparty = pickString(r, ['counterparty', 'party', 'customer', 'supplier', 'payee', 'name'], '');
  const reference = pickString(r, ['reference', 'ref', 'invoice_number', 'doc_no'], id);

  const allowed: ERPTransactionType[] = ['sale', 'purchase', 'expense', 'payment'];
  const type = (allowed.includes(typeRaw as ERPTransactionType) ? typeRaw : 'payment') as ERPTransactionType;

  return {
    id,
    type,
    amount,
    date: date || new Date().toISOString().slice(0, 10),
    description,
    counterparty,
    reference,
  };
}

function parseExpenseLine(row: unknown): { category: string; amount: number } | null {
  const r = asRecord(row);
  if (!r) return null;
  const category = pickString(r, ['category', 'name', 'label', 'account'], '');
  const amount = Math.abs(pickNumber(r, ['amount', 'value', 'total']));
  if (!category || amount <= 0) return null;
  return { category, amount };
}

/** Iterate recent transaction lines from unmodified snapshot JSON (for raw `payload` storage). */
export function listRecentTransactionsFromSnapshotJson(json: unknown): {
  raw: unknown;
  parsed: ERPTransaction | null;
}[] {
  const o = asRecord(json);
  const arr = o && Array.isArray(o.recent_transactions) ? o.recent_transactions : [];
  return arr.map((raw, i) => ({ raw, parsed: parseTransactionRow(raw, i) }));
}

/** Best-effort parse for varying Srijaya snapshot JSON shapes. */
export function parseErpFinancialSnapshot(json: unknown): ERPFinancialSnapshot {
  const o = asRecord(json) || {};
  const rawList = o.recent_transactions;
  const recentArr = Array.isArray(rawList) ? rawList : [];
  const recent_transactions = recentArr
    .map((row, i) => parseTransactionRow(row, i))
    .filter((x): x is ERPTransaction => x !== null);

  const periodRaw = asRecord(o.period);
  const expensesRaw = o.expenses;
  const expensesList = Array.isArray(expensesRaw) ? expensesRaw : [];
  const expenses = expensesList
    .map(parseExpenseLine)
    .filter((x): x is { category: string; amount: number } => x !== null);

  return {
    period: periodRaw
      ? {
          from: pickString(periodRaw, ['from', 'start'], ''),
          to: pickString(periodRaw, ['to', 'end'], ''),
        }
      : undefined,
    sales_total: pickNumber(o, ['sales_total', 'sales']),
    purchase_total: pickNumber(o, ['purchase_total', 'purchases']),
    outstanding_receivables: pickNumber(o, ['outstanding_receivables', 'receivables']),
    outstanding_payables: pickNumber(o, ['outstanding_payables', 'payables']),
    inventory_value: pickNumber(o, ['inventory_value', 'inventory']),
    payroll_total: pickNumber(o, ['payroll_total', 'payroll']),
    expenses: expenses.length ? expenses : undefined,
    recent_transactions,
  };
}
