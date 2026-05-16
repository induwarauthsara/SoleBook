const BLOCKED_PATTERNS = [
  /transfer\s+(money|funds|amount)/i,
  /approve\s+(payment|transaction)/i,
  /execute\s+(payment|transfer)/i,
  /move\s+money/i,
  /initiate\s+(payment|transfer)/i,
  /authorize\s+/i,
  /\b(password|secret|api.?key|token)\s*[:=]/i,
  /account\s*number\s*[:=]?\s*\d/i,
];

export interface SafetyResult {
  passed: boolean;
  blockedReasons: string[];
}

export function filterAIOutput(output: string): SafetyResult {
  const reasons: string[] = [];

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(output)) {
      reasons.push(`Blocked pattern: ${pattern.source}`);
    }
  }

  if (/\b\d{10,18}\b/.test(output)) {
    reasons.push('Possible account number in output');
  }

  return { passed: reasons.length === 0, blockedReasons: reasons };
}

export function filterUserInput(input: string): { safe: boolean; reason?: string } {
  const dangerousPrompts = [
    /ignore\s+(previous|above|all)\s+(instructions|prompts)/i,
    /you\s+are\s+now\s+/i,
    /pretend\s+you\s+are/i,
    /system\s*prompt/i,
    /jailbreak/i,
  ];

  for (const pattern of dangerousPrompts) {
    if (pattern.test(input)) {
      return { safe: false, reason: 'Potentially adversarial input detected' };
    }
  }

  return { safe: true };
}
