export interface Transaction {
  id: string;
  counterpartyAlias: string;
  amount: number;
  category: string;
  occurredAt: string;
}

export interface DuplicateResult {
  transactionId: string;
  duplicateOf: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export function detectDuplicates(transactions: Transaction[]): DuplicateResult[] {
  const results: DuplicateResult[] = [];
  const sorted = [...transactions].sort((a, b) =>
    new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      const daysDiff = Math.abs(
        (new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Same counterparty + similar amount within 7 days
      if (
        a.counterpartyAlias &&
        a.counterpartyAlias === b.counterpartyAlias &&
        Math.abs(a.amount - b.amount) / Math.max(a.amount, b.amount) < 0.05 &&
        daysDiff <= 7
      ) {
        results.push({
          transactionId: a.id,
          duplicateOf: b.id,
          confidence: daysDiff <= 1 ? 'high' : daysDiff <= 3 ? 'medium' : 'low',
          reason: `Same counterparty "${a.counterpartyAlias}" with similar amount within ${Math.round(daysDiff)} days`,
        });
        break;
      }

      // Same amount + same category within 3 days
      if (
        a.amount === b.amount &&
        a.category === b.category &&
        daysDiff <= 3
      ) {
        results.push({
          transactionId: a.id,
          duplicateOf: b.id,
          confidence: daysDiff <= 1 ? 'high' : 'medium',
          reason: `Same amount and category "${a.category}" within ${Math.round(daysDiff)} days`,
        });
        break;
      }
    }
  }

  return results;
}
