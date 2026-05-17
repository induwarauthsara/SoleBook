/** Matches `computeNextDueDate` in `generate-recurring/route.ts`. */
export const OBLIGATION_RECURRENCE_CODES = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export type ObligationRecurrenceCode =
  (typeof OBLIGATION_RECURRENCE_CODES)[number];

const ALLOWED = new Set<string>(OBLIGATION_RECURRENCE_CODES);

export function normalizeObligationRecurrence(value: unknown):
  | { ok: true; recurrence: string | null }
  | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, recurrence: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "recurrence must be a string or omitted" };
  }
  const v = value.trim().toLowerCase();
  if (v === "") {
    return { ok: true, recurrence: null };
  }
  if (!ALLOWED.has(v)) {
    return {
      ok: false,
      error: `recurrence must be one of: ${OBLIGATION_RECURRENCE_CODES.join(", ")}`,
    };
  }
  return { ok: true, recurrence: v };
}
