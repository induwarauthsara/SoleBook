import type { Obligation, ObligationStatus, Priority } from "@/types/app";

/** Map DB `obligation_category` to UI tab group for filters. */
export function obligationGroupFromCategory(
  category: string | undefined | null,
): Obligation["group"] | undefined {
  const c = typeof category === "string" ? category.trim().toLowerCase() : "";
  switch (c) {
    case "supplier":
      return "suppliers";
    case "utilities":
      return "utilities";
    case "payroll":
      return "staff";
    case "rent":
      return "rent";
    case "loan":
      return "loan";
    case "tax":
    case "subscription":
    case "other":
      return "other";
    default:
      return undefined;
  }
}

function mapDbStatusToApp(status: string | undefined): ObligationStatus {
  if (status === "paid") return "paid";
  if (status === "overdue") return "overdue";
  return "pending";
}

function mapPriority(raw: string | undefined): Priority {
  const u = (raw || "medium").toLowerCase();
  if (u === "high") return "HIGH";
  if (u === "low") return "LOW";
  return "MEDIUM";
}

/**
 * Map a Supabase obligations row or GET /api/obligations item into the app `Obligation` shape.
 */
export function mapApiRowToObligation(o: Record<string, unknown>): Obligation {
  const category =
    typeof o.category === "string" ? o.category : String(o.category ?? "");
  const counterparty =
    typeof o.counterparty_alias === "string" ? o.counterparty_alias : "";
  return {
    id: String(o.id ?? ""),
    businessId: typeof o.org_id === "string" ? o.org_id : String(o.org_id ?? ""),
    name: counterparty.trim() ? counterparty : category || "Obligation",
    amount: Number(o.amount_lkr ?? 0),
    dueDate:
      typeof o.due_date === "string"
        ? o.due_date
        : "",
    priority: mapPriority(
      typeof o.priority === "string" ? o.priority : undefined,
    ),
    status: mapDbStatusToApp(
      typeof o.status === "string" ? o.status : undefined,
    ),
    category,
    recurring: Boolean(o.recurrence),
    group: obligationGroupFromCategory(category),
  };
}
