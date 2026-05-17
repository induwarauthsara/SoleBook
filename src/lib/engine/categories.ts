const COUNTERPARTY_PATTERNS: Record<string, string> = {
  'ceb': 'utilities',
  'leco': 'utilities',
  'nwsdb': 'utilities',
  'dialog': 'utilities',
  'mobitel': 'utilities',
  'slt': 'utilities',
  'pos sweep': 'sales',
  'pos settlement': 'sales',
  'payroll': 'payroll',
  'staff': 'payroll',
  'salary': 'payroll',
  'epf': 'tax',
  'etf': 'tax',
  'inland revenue': 'tax',
  'vat': 'tax',
  'rent': 'rent',
  'lease': 'rent',
  'loan': 'loan',
  'installment': 'loan',
  'supplier': 'cogs',
  'inventory': 'cogs',
  'fuel': 'transport',
  'delivery': 'transport',
};

const DESCRIPTION_PATTERNS: Record<string, string> = {
  'electricity': 'utilities',
  'water bill': 'utilities',
  'internet': 'utilities',
  'telephone': 'utilities',
  'insurance': 'insurance',
  'marketing': 'marketing',
  'advertising': 'marketing',
  'repair': 'maintenance',
  'maintenance': 'maintenance',
  'training': 'training',
  'equipment': 'equipment',
};

export function categorizeTransaction(
  counterpartyAlias: string | null,
  description: string | null,
  amount: number,
  direction: 'inflow' | 'outflow'
): string {
  if (direction === 'inflow') {
    return 'sales';
  }

  const normalizedCounterparty = (counterpartyAlias || '').toLowerCase();
  const normalizedDescription = (description || '').toLowerCase();

  // Check counterparty patterns
  for (const [pattern, category] of Object.entries(COUNTERPARTY_PATTERNS)) {
    if (normalizedCounterparty.includes(pattern)) return category;
  }

  // Check description patterns
  for (const [pattern, category] of Object.entries(DESCRIPTION_PATTERNS)) {
    if (normalizedDescription.includes(pattern)) return category;
  }

  return 'other';
}

export const EXPENSE_GROUPS = {
  fixed: ['rent', 'subscription', 'insurance'],
  variable: ['cogs', 'transport', 'delivery'],
  urgent: ['payroll', 'utilities', 'loan'],
  risky: ['personal', 'unplanned'],
  growth: ['equipment', 'marketing', 'training'],
  compliance: ['tax', 'license'],
  debt: ['loan', 'lease'],
} as const;

export function getExpenseGroup(category: string): string {
  for (const [group, categories] of Object.entries(EXPENSE_GROUPS)) {
    if ((categories as readonly string[]).includes(category)) return group;
  }
  return 'other';
}
