import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireRole, handleAuthError } from "@/lib/auth/middleware";
import { SEYLAN_BANK_OPTIONS } from "@/lib/seylan/bank-codes";

const JUSTPAY_PROVIDER = "seylan_justpay";

function bankLabelForCode(code: string): string {
  return SEYLAN_BANK_OPTIONS.find((b) => b.code === code)?.label ?? code;
}

/** `accounts.account_mask` allows max 8 chars — Seylan masks may be longer. */
function truncateMask(mask: string): string {
  const t = mask.trim();
  if (t.length <= 8) return t;
  return t.slice(-8);
}

type JustpayMetadata = {
  account_token?: string;
  bank_code?: string;
  registration_reference?: string;
  linked_at?: string;
  display_mask?: string;
};

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ["owner", "finance"]);
    if (!ctx.org) return Response.json({ error: "No organization" }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Server error" }, { status: 500 });

    const { data: row } = await supabase
      .from("integrations")
      .select("id, status, metadata")
      .eq("org_id", ctx.org.id)
      .eq("type", "bank")
      .eq("provider", JUSTPAY_PROVIDER)
      .maybeSingle();

    const meta = (row?.metadata ?? {}) as JustpayMetadata;
    const linked =
      row?.status === "active" &&
      !!(meta.account_token || meta.display_mask);

    return Response.json({
      linked,
      accountMask: meta.display_mask ?? null,
      bankCode: meta.bank_code ?? null,
      linkedAt: meta.linked_at ?? null,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole(req, ["owner", "finance"]);
    if (!ctx.org) return Response.json({ error: "No organization" }, { status: 403 });

    const body = await req.json();
    const {
      accountToken,
      accountMask,
      bankCode,
      referenceId,
      bankLabel: bankLabelRaw,
    } = body as {
      accountToken?: string;
      accountMask?: string;
      bankCode?: string;
      referenceId?: string;
      bankLabel?: string;
    };

    if (!bankCode || typeof bankCode !== "string") {
      return Response.json({ error: "bankCode required" }, { status: 400 });
    }
    if (
      (!accountToken || typeof accountToken !== "string") &&
      (!accountMask || typeof accountMask !== "string")
    ) {
      return Response.json(
        { error: "accountToken or accountMask required after verification" },
        { status: 400 },
      );
    }

    const bankLabel =
      typeof bankLabelRaw === "string" && bankLabelRaw.trim()
        ? bankLabelRaw.trim()
        : bankLabelForCode(bankCode);

    const displayMask =
      typeof accountMask === "string" && accountMask.trim()
        ? accountMask.trim()
        : "········";

    const meta: JustpayMetadata = {
      account_token: typeof accountToken === "string" ? accountToken : undefined,
      bank_code: bankCode,
      registration_reference:
        typeof referenceId === "string" ? referenceId : undefined,
      linked_at: new Date().toISOString(),
      display_mask: displayMask,
    };

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Server error" }, { status: 500 });

    const { data: existing } = await supabase
      .from("integrations")
      .select("id")
      .eq("org_id", ctx.org.id)
      .eq("type", "bank")
      .eq("provider", JUSTPAY_PROVIDER)
      .maybeSingle();

    const integrationPayload = {
      org_id: ctx.org.id,
      type: "bank" as const,
      provider: JUSTPAY_PROVIDER,
      display_name: `${bankLabel} (JustPay)`,
      status: "active" as const,
      metadata: meta as unknown as Record<string, unknown>,
      last_error: null,
      created_by: ctx.user.id,
    };

    if (existing?.id) {
      const { error: upErr } = await supabase
        .from("integrations")
        .update({
          display_name: integrationPayload.display_name,
          status: integrationPayload.status,
          metadata: integrationPayload.metadata,
          last_error: null,
        })
        .eq("id", existing.id);
      if (upErr) return Response.json({ error: upErr.message }, { status: 500 });
    } else {
      const { error: insErr } = await supabase
        .from("integrations")
        .insert(integrationPayload);
      if (insErr) return Response.json({ error: insErr.message }, { status: 500 });
    }

    const maskDb = truncateMask(displayMask);

    const { data: primary } = await supabase
      .from("accounts")
      .select("id")
      .eq("org_id", ctx.org.id)
      .eq("is_primary", true)
      .maybeSingle();

    if (primary?.id) {
      const { error: accErr } = await supabase
        .from("accounts")
        .update({
          bank_name: bankLabel,
          account_mask: maskDb,
          type: "bank",
        })
        .eq("id", primary.id);
      if (accErr) return Response.json({ error: accErr.message }, { status: 500 });
    } else {
      const { error: insAccErr } = await supabase.from("accounts").insert({
        org_id: ctx.org.id,
        name: `${bankLabel} · Operating`,
        type: "bank",
        bank_name: bankLabel,
        account_mask: maskDb,
        currency: "LKR",
        current_balance: 0,
        is_primary: true,
      });
      if (insAccErr) return Response.json({ error: insAccErr.message }, { status: 500 });
    }

    return Response.json({
      ok: true,
      accountMask: displayMask,
      bankCode,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const ctx = await requireRole(_req, ["owner", "finance"]);
    if (!ctx.org) return Response.json({ error: "No organization" }, { status: 403 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Server error" }, { status: 500 });

    await supabase
      .from("integrations")
      .delete()
      .eq("org_id", ctx.org.id)
      .eq("type", "bank")
      .eq("provider", JUSTPAY_PROVIDER);

    return Response.json({ ok: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
