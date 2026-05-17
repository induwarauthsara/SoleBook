/**
 * Deterministic chat replies when Gemini is unavailable (no API key) or
 * SOLEBOOK_MOCK_AI=true. Still persisted via /api/ai/chat like real turns.
 */
export function buildMockChatReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes('reserve'))
    return 'Your reserve fell 40% last month because operations took an extra LKR 96K. Shifting 5% of incoming sales should bring it back on track in three weeks.';
  if (lower.includes('withdraw') || lower.includes('salary'))
    return 'Right now I’d cap your withdrawal at LKR 62,000 this week so the EPF/ETF contribution on the 18th still has cover.';
  if (lower.includes('month') || lower.includes('forecast'))
    return 'Next month looks balanced. Days 12–18 will be tight — three obligations cluster there. I’ll reserve them ahead of time once approved.';
  return 'Got it. Based on the latest figures, I’d focus on protecting the supplier invoice and keeping the reserve untouched until the next settlement clears.';
}

export function shouldUseMockAI(): boolean {
  if (process.env.SOLEBOOK_MOCK_AI === 'true') return true;
  const key = process.env.GEMINI_API_KEY;
  return typeof key !== 'string' || key.trim().length === 0;
}
